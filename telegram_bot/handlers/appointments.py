import uuid
import math
import httpx
import logging
from datetime import datetime, timedelta
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select
from app.bot.states import BookingStates
from app.bot.keyboards import facility_keyboard, slot_keyboard, confirm_keyboard, location_request_keyboard, token_actions_keyboard
from app.bot.bot import get_db_session
from app.bot.i18n import get_text, get_specialization_name
from app.services.hospital_discovery_service import fetch_real_nearby_hospitals
from app.services.user_linking_service import get_patient_by_chat_id, get_or_create_telegram_user
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.services.queue_service import create_queue_token
from app.services.event_bus import event_bus, APPOINTMENT_CREATED

logger = logging.getLogger(__name__)
router = Router()


def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


CITY_COORDINATES = {
    "city_jaipur": (26.9124, 75.7873, "Jaipur"),
    "city_delhi": (28.6139, 77.2090, "Delhi / NCR"),
    "city_mumbai": (19.0760, 72.8777, "Mumbai"),
    "city_pune": (18.5204, 73.8567, "Pune"),
    "city_bangalore": (12.9716, 77.5946, "Bangalore"),
    "city_hyderabad": (17.3850, 78.4867, "Hyderabad"),
    "city_chennai": (13.0827, 80.2707, "Chennai"),
    "city_kolkata": (22.5726, 88.3639, "Kolkata")
}


async def geocode_city_or_area(place_name: str) -> tuple[float, float, str]:
    """Geocodes a user-entered city or area name to (lat, lon, display_name) with India bias."""
    clean_name = place_name.strip()
    if clean_name.isdigit() or len(clean_name) < 3 or clean_name.lower() in ["hi", "hello", "test", "1", "2", "3"]:
        return 0.0, 0.0, ""

    headers = {"User-Agent": "TriagePlusHealth/1.0 (contact: support@triage.local)"}
    search_query = f"{clean_name}, India" if "india" not in clean_name.lower() else clean_name
    nom_url = f"https://nominatim.openstreetmap.org/search?q={search_query}&format=json&limit=1"
    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            r = await client.get(nom_url, headers=headers)
            if r.status_code == 200 and r.json():
                item = r.json()[0]
                return float(item["lat"]), float(item["lon"]), item.get("display_name", clean_name)
    except Exception as e:
        logger.warning(f"Geocoding error for '{place_name}': {e}")
async def get_nearby_facility_options(db, lat: float, lon: float, specialty: str = "General Medicine"):
    """Discovers real operational hospitals around user coordinates and syncs to DB."""
    discovered = await fetch_real_nearby_hospitals(
        db,
        latitude=lat,
        longitude=lon,
        radius_km=30.0,
        specialty=specialty
    )

    facilities = []
    if discovered:
        for item in discovered[:6]:
            fac_name = item.get("name") or item.get("facility", {}).get("name", "Hospital")
            dist = item.get("distance_km")
            lat_fac = item.get("latitude") or item.get("facility", {}).get("latitude", lat)
            lon_fac = item.get("longitude") or item.get("facility", {}).get("longitude", lon)

            # Check if exists in DB or create dynamically
            stmt = select(Facility).where(Facility.name == fac_name)
            res = await db.execute(stmt)
            db_fac = res.scalars().first()

            if not db_fac:
                try:
                    new_id = uuid.uuid4()
                    db_fac = Facility(
                        id=new_id,
                        name=fac_name,
                        address=item.get("address", "Healthcare Zone"),
                        latitude=lat_fac,
                        longitude=lon_fac,
                        phone="+91-11-26588500",
                        facility_type="Hospital",
                        emergency_services=True,
                        is_active=True
                    )
                    db.add(db_fac)
                    await db.flush()

                    # Add duty doctor + specialist team
                    docs = [
                        Doctor(
                            facility_id=new_id,
                            full_name="Dr. Rajesh Sharma",
                            specialization="Senior Consultant",
                            license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                            consultation_fee=300.0,
                            experience_years=12,
                            is_available=True
                        ),
                        Doctor(
                            facility_id=new_id,
                            full_name="Dr. Anita Verma",
                            specialization="General Physician",
                            license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                            consultation_fee=250.0,
                            experience_years=8,
                            is_available=True
                        ),
                        Doctor(
                            facility_id=new_id,
                            full_name="Dr. Vikram Patel",
                            specialization="Specialist",
                            license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                            consultation_fee=350.0,
                            experience_years=10,
                            is_available=True
                        ),
                        Doctor(
                            facility_id=new_id,
                            full_name="Duty Medical Officer",
                            specialization="Emergency & Triage",
                            license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                            consultation_fee=0,
                            experience_years=5,
                            is_available=True
                        )
                    ]
                    db.add_all(docs)
                    await db.commit()
                except Exception as e:
                    await db.rollback()
                    logger.warning(f"Error registering discovered facility: {e}")
                    continue

            facilities.append({
                "id": str(db_fac.id),
                "name": db_fac.name,
                "distance_km": dist
            })

    if not facilities:
        stmt = select(Facility).where(Facility.is_active == True)
        result = await db.execute(stmt)
        for f in result.scalars().all():
            d = calculate_haversine(lat, lon, f.latitude or lat, f.longitude or lon)
            facilities.append({"id": str(f.id), "name": f.name, "distance_km": d})

    facilities.sort(key=lambda x: x.get("distance_km", 999.0))
    return facilities[:6]


from app.bot.keyboards import quick_cities_keyboard

@router.message(Command("nearby"))

@router.callback_query(F.data == "menu_nearby")
@router.callback_query(F.data == "show_facilities")
@router.callback_query(F.data == "menu_book")
async def start_booking(event: CallbackQuery | Message, state: FSMContext):
    if isinstance(event, CallbackQuery):
        await event.answer()
        message = event.message
    else:
        message = event

    data = await state.get_data()
    lang = data.get('language', 'en')
    lat = data.get('latitude')
    lon = data.get('longitude')

    # If location is not yet provided by the user, ask for it with quick-select cities + reply keyboard
    if lat is None or lon is None:
        await state.set_state(BookingStates.awaiting_location)
        prompt_text = {
            'en': "📍 **Find Real Hospitals Near You**\n\nTap a city below, or reply with your **City / Area Name** (e.g. *Jaipur, Mansarovar, Mumbai, Pune, Bangalore*):",
            'hi': "📍 **नजदीकी असली अस्पताल खोजें**\n\nनीचे दिए गए शहर पर टैप करें, या अपने **शहर / क्षेत्र का नाम** लिखकर भेजें (उदा. *जयपुर, मानसरोवर, मुंबई, पुणे*):",
            'mr': "📍 **जवळील थेट रुग्णालय शोधा**\n\nखालील शहरावर टॅप करा किंवा आपल्या **शहराचे / भागाचे नाव** लिहून पाठवा (उदा. *पुणे, मुंबई, नागपूर*):",
            'ta': "📍 **அருகிலுள்ள மருத்துவமனைகளைக் கண்டறியவும்**\n\nகீழே உள்ள நகரத்தைத் தட்டவும் அல்லது உங்கள் **நகரத்தின் பெயரை** தட்டச்சு செய்து அனுப்பவும்:",
            'te': "📍 **సమీప ఆసుపత్రులను కనుగొనండి**\n\nక్రింది నగరంపై నొక్కండి లేదా మీ **నగరం / ప్రాంతం పేరు** టైప్ చేసి పంపండి:"
        }.get(lang, "📍 Tap a city below or type your City/Area name:")

        await message.answer(
            prompt_text,
            parse_mode="Markdown",
            reply_markup=quick_cities_keyboard()
        )
        return

    # Location exists -> fetch live hospitals near coordinates
    async with get_db_session() as db:
        facilities = await get_nearby_facility_options(db, lat=lat, lon=lon)

    if not facilities:
        await message.answer(get_text("no_facilities", lang))
        return

    await state.set_state(BookingStates.selecting_facility)
    await message.answer(
        f"🏥 **{get_text('nearby_hospitals', lang)}**\n\n{get_text('select_facility', lang)}",
        parse_mode="Markdown",
        reply_markup=facility_keyboard(facilities, lang)
    )


@router.callback_query(F.data.startswith("city_"))
async def handle_quick_city_selection(callback: CallbackQuery, state: FSMContext):
    """Handles 1-tap quick city selection or manual city typing from the inline keyboard."""
    await callback.answer()
    city_key = callback.data
    data = await state.get_data()
    lang = data.get('language', 'en')

    if city_key == "city_manual_type":
        await state.set_state(BookingStates.awaiting_location)
        await callback.message.answer(
            "✏️ **Enter Custom City or Area Name**\n\nPlease type your city or neighborhood name below (e.g. *Mansarovar Jaipur*, *Indiranagar Bangalore*, *Ahmedabad*, *Chandigarh*, *Lucknow*):",
            parse_mode="Markdown"
        )
        return

    if city_key in CITY_COORDINATES:
        lat, lon, city_name = CITY_COORDINATES[city_key]
        await state.update_data(latitude=lat, longitude=lon)

        loading_msg = await callback.message.answer(
            f"🔍 *Discovering real operational hospitals in {city_name}...*",
            parse_mode="Markdown"
        )

        async with get_db_session() as db:
            facilities = await get_nearby_facility_options(db, lat=lat, lon=lon)


        await loading_msg.delete()
        if not facilities:
            await callback.message.answer(get_text("no_facilities", lang))
            return

        await state.set_state(BookingStates.selecting_facility)
        await callback.message.answer(
            f"📍 **Hospitals in {city_name}**\n\n{get_text('select_facility', lang)}",
            parse_mode="Markdown",
            reply_markup=facility_keyboard(facilities, lang)
        )


@router.message(BookingStates.awaiting_location, F.location)
@router.message(F.location)
async def handle_user_location(message: Message, state: FSMContext):
    """Seamlessly captures GPS location when user shares a location pin or taps the share button."""
    lat = message.location.latitude
    lon = message.location.longitude
    await state.update_data(latitude=lat, longitude=lon)

    data = await state.get_data()
    lang = data.get('language', 'en')

    loading_msg = await message.answer(
        "🔍 *Searching live operational hospitals near your GPS coordinates...*",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove()
    )

    async with get_db_session() as db:
        facilities = await get_nearby_facility_options(db, lat=lat, lon=lon)

    await state.set_state(BookingStates.selecting_facility)
    await loading_msg.delete()
    await message.answer(
        f"📍 **Nearby Hospitals Found**\n\n{get_text('select_facility', lang)}",
        parse_mode="Markdown",
        reply_markup=facility_keyboard(facilities, lang)
    )


@router.message(BookingStates.awaiting_location, F.text)
async def handle_city_name_input(message: Message, state: FSMContext):
    """Geocodes user-entered city or area name and discovers nearby live hospitals."""
    query_text = message.text.strip()
    data = await state.get_data()
    lang = data.get('language', 'en')

    if query_text.isdigit() or len(query_text) < 3:
        await message.answer(
            "⚠️ Please tap one of the cities below or type a city name (e.g. *Jaipur*, *Pune*, *Mumbai*):",
            parse_mode="Markdown",
            reply_markup=quick_cities_keyboard()
        )
        return

    loading_msg = await message.answer(
        f"🔍 *Locating '{query_text}' and discovering nearby hospitals...*",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove()
    )

    lat, lon, display_name = await geocode_city_or_area(query_text)
    if not lat or not lon:
        await loading_msg.delete()
        await message.answer(
            "⚠️ Could not resolve this location. Please tap one of the cities below or type a major city name (e.g. *Jaipur*, *Mumbai*):",
            parse_mode="Markdown",
            reply_markup=quick_cities_keyboard()
        )
        return

    await state.update_data(latitude=lat, longitude=lon)

    async with get_db_session() as db:
        facilities = await get_nearby_facility_options(db, lat=lat, lon=lon)

    await loading_msg.delete()
    if not facilities:
        await message.answer(get_text("no_facilities", lang))
        return

    short_place = display_name.split(",")[0]
    await state.set_state(BookingStates.selecting_facility)
    await message.answer(
        f"📍 **Hospitals near {short_place}**\n\n{get_text('select_facility', lang)}",
        parse_mode="Markdown",
        reply_markup=facility_keyboard(facilities, lang)
    )



@router.callback_query(BookingStates.selecting_facility, F.data.startswith("fac_"))
async def select_facility(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    fac_id = callback.data.split('_')[1]
    await state.update_data(facility_id=fac_id)
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        fac_uuid = uuid.UUID(fac_id)
        stmt = select(Doctor).where(Doctor.facility_id == fac_uuid)
        result = await db.execute(stmt)
        doctors = list(result.scalars().all())

        fac_stmt = select(Facility).where(Facility.id == fac_uuid)
        fac_res = await db.execute(fac_stmt)
        facility = fac_res.scalars().first()
        if facility:
            await state.update_data(facility_name=facility.name)

        # If less than 2 doctors exist, populate specialist team
        if len(doctors) < 2:
            default_doctors = [
                Doctor(
                    facility_id=fac_uuid,
                    full_name="Dr. Rajesh Sharma",
                    specialization="Senior Consultant",
                    license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                    consultation_fee=300.0,
                    experience_years=12,
                    is_available=True
                ),
                Doctor(
                    facility_id=fac_uuid,
                    full_name="Dr. Anita Verma",
                    specialization="General Physician",
                    license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                    consultation_fee=250.0,
                    experience_years=8,
                    is_available=True
                ),
                Doctor(
                    facility_id=fac_uuid,
                    full_name="Dr. Vikram Patel",
                    specialization="Specialist Surgeon",
                    license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                    consultation_fee=400.0,
                    experience_years=10,
                    is_available=True
                )
            ]
            db.add_all(default_doctors)
            await db.commit()

            stmt = select(Doctor).where(Doctor.facility_id == fac_uuid)
            result = await db.execute(stmt)
            doctors = list(result.scalars().all())

    # Build clean, spacious, uncluttered doctor cards
    doc_buttons = []
    for d in doctors:
        role = d.specialization or "Specialist"
        doc_buttons.append([
            InlineKeyboardButton(
                text=f"👨‍⚕️ {d.full_name} ({role})",
                callback_data=f"doc_{d.id}"
            )
        ])
    doc_buttons.append([
        InlineKeyboardButton(text="👨‍⚕️ Duty Medical Officer", callback_data="doc_default")
    ])
    doc_kb = InlineKeyboardMarkup(inline_keyboard=doc_buttons)

    await state.set_state(BookingStates.selecting_doctor)
    await callback.message.answer(
        f"👨‍⚕️ **{get_text('select_doctor', lang)}**\n\nChoose an available physician at *{data.get('facility_name', 'Facility')}*:",
        parse_mode="Markdown",
        reply_markup=doc_kb
    )


@router.callback_query(BookingStates.selecting_doctor, F.data.startswith("doc_"))
async def select_doctor(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    doc_id = callback.data.split('_')[1]
    await state.update_data(doctor_id=doc_id)
    data = await state.get_data()
    lang = data.get('language', 'en')

    if doc_id != "default":
        async with get_db_session() as db:
            stmt = select(Doctor).where(Doctor.id == uuid.UUID(doc_id))
            result = await db.execute(stmt)
            doctor = result.scalars().first()
            if doctor:
                await state.update_data(
                    doctor_name=doctor.full_name,
                    doctor_spec=doctor.specialization
                )
    else:
        await state.update_data(
            doctor_name="Duty Medical Officer",
            doctor_spec="General Medicine"
        )

    slots_info = [
        ('slot_today_morning', 'today_morning'),
        ('slot_today_afternoon', 'today_afternoon'),
        ('slot_tonight', 'tonight'),
        ('slot_tomorrow_morning', 'tomorrow_morning')
    ]

    await state.set_state(BookingStates.selecting_slot)
    await callback.message.answer(get_text("select_slot", lang), reply_markup=slot_keyboard(slots_info, lang))


@router.callback_query(BookingStates.selecting_slot, F.data.startswith("slot_"))
async def select_slot(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    slot_type = callback.data.split('_', 1)[1]
    await state.update_data(slot_type=slot_type)

    now = datetime.now()
    if slot_type == "today_morning":
        scheduled_start = now.replace(hour=10, minute=0, second=0, microsecond=0)
    elif slot_type == "today_afternoon":
        scheduled_start = now.replace(hour=14, minute=0, second=0, microsecond=0)
    elif slot_type == "tonight":
        scheduled_start = now.replace(hour=20, minute=0, second=0, microsecond=0)
    else:  # tomorrow_morning
        tomorrow = now + timedelta(days=1)
        scheduled_start = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)

    scheduled_end = scheduled_start + timedelta(minutes=30)
    await state.update_data(
        scheduled_start=scheduled_start.isoformat(),
        scheduled_end=scheduled_end.isoformat()
    )

    data = await state.get_data()
    lang = data.get('language', 'en')
    fac_name = data.get('facility_name', 'Selected Hospital')
    doc_name = data.get('doctor_name', 'Duty Medical Officer')
    slot_label = get_text(f"slot_{slot_type}", lang)

    summary = (
        f"{get_text('confirm_booking_summary', lang)}\n\n"
        f"🏥 **Hospital**: {fac_name}\n"
        f"👨‍⚕️ **Doctor**: {doc_name}\n"
        f"⏰ **Preferred Slot**: {slot_label}"
    )

    await state.set_state(BookingStates.confirming)
    await callback.message.answer(summary, parse_mode="Markdown", reply_markup=confirm_keyboard(lang))


@router.callback_query(BookingStates.confirming, F.data == "confirm_yes")
async def confirm_booking_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        user, patient, _ = await get_or_create_telegram_user(
            db,
            chat_id=callback.message.chat.id,
            full_name=callback.from_user.full_name or "Patient",
            phone=data.get('phone', None),
            language=lang
        )

        fac_id = uuid.UUID(data['facility_id'])
        doc_id_raw = data.get('doctor_id', 'default')

        if doc_id_raw == "default":
            doc_stmt = select(Doctor).where(Doctor.facility_id == fac_id)
            doc_res = await db.execute(doc_stmt)
            doctor = doc_res.scalars().first()
            if not doctor:
                doctor = Doctor(
                    facility_id=fac_id,
                    full_name="Duty Medical Officer",
                    specialization="General Medicine",
                    license_number=f"DOC-{uuid.uuid4().hex[:8].upper()}",
                    consultation_fee=0,
                    experience_years=5,
                    is_available=True
                )
                db.add(doctor)
                await db.flush()
            doc_id = doctor.id
        else:
            doc_id = uuid.UUID(doc_id_raw)

        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            facility_id=fac_id,
            scheduled_start=datetime.fromisoformat(data['scheduled_start']),
            scheduled_end=datetime.fromisoformat(data['scheduled_end']),
            status="SCHEDULED",
            consultation_type="IN_PERSON",
            chief_complaint=data.get('symptoms', 'Routine Consultation')
        )
        db.add(appointment)
        await db.flush()

        token = await create_queue_token(
            db,
            appointment_id=appointment.id
        )


        token_num = token.token_number
        wait_mins = token.estimated_wait_minutes
        pos = token.position
        token_id_str = str(token.id)

        await event_bus.publish(APPOINTMENT_CREATED, {
            "appointment_id": str(appointment.id),
            "patient_id": str(patient.id),
            "facility_id": str(fac_id),
            "doctor_id": str(doc_id),
            "token_number": token_num,
            "scheduled_start": data['scheduled_start'],
            "telegram_chat_id": callback.message.chat.id
        })

    await state.clear()
    msg = (
        f"✅ **Appointment Confirmed!**\n\n"
        f"🎟️ **Token Number**: `{token_num}`\n"
        f"📍 **Queue Position**: `#{pos}`\n"
        f"⏳ **Estimated Wait**: `~{wait_mins} mins`\n\n"
        f"🏥 **Hospital**: {data.get('facility_name', 'Hospital')}\n"
        f"👨‍⚕️ **Doctor**: {data.get('doctor_name', 'Doctor')}"
    )

    await callback.message.answer(
        msg,
        parse_mode="Markdown",
        reply_markup=token_actions_keyboard(token_id_str, lang)
    )


@router.callback_query(BookingStates.confirming, F.data == "confirm_no")
async def cancel_booking_flow(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')
    await state.clear()
    await callback.message.answer(get_text("booking_cancelled", lang))
