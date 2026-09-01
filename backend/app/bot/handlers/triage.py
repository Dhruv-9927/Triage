import tempfile
import os
import uuid
from datetime import datetime, timedelta
import httpx
from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select
from app.bot.states import TriageStates
from app.bot.keyboards import urgency_keyboard, triage_mild_keyboard
from app.services.triage_service import assess_symptoms
from app.services.user_linking_service import get_patient_by_chat_id, get_or_create_telegram_user
from app.services.queue_service import create_queue_token
from app.services.event_bus import event_bus, TRIAGE_COMPLETED, APPOINTMENT_CREATED
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.triage_session import TriageSession
from app.bot.bot import get_db_session, bot
from app.bot.i18n import get_text
from app.config import settings

router = Router()


@router.callback_query(F.data == "menu_triage")
async def start_triage(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        patient = await get_patient_by_chat_id(db, callback.message.chat.id)
        if patient:
            await state.update_data(patient_id=str(patient.id))

    await state.set_state(TriageStates.waiting_symptoms)
    await callback.message.answer(get_text("ask_symptoms", lang))


@router.message(TriageStates.waiting_symptoms)
async def process_symptoms(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get('language', 'en')

    symptoms = ""
    if message.voice:
        try:
            file = await bot.get_file(message.voice.file_id)
            temp_dir = tempfile.gettempdir()
            ogg_path = os.path.join(temp_dir, f"{message.voice.file_id}.ogg")
            await bot.download_file(file.file_path, ogg_path)


            async with httpx.AsyncClient(timeout=15.0) as client:
                with open(ogg_path, "rb") as f:
                    resp = await client.post(
                        f"{settings.N8N_WEBHOOK_BASE_URL}/transcribe-audio",
                        files={"file": f}
                    )
                if resp.status_code == 200:
                    symptoms = resp.json().get('text', '')
        except Exception:
            symptoms = message.caption or "Voice note received"
    elif message.text:
        symptoms = message.text

    if not symptoms:
        await message.answer(get_text("ask_symptoms", lang))
        return

    # Run AI Clinical Triage Gatekeeper Assessment
    assessment = await assess_symptoms(symptoms, language=lang)
    urgency = assessment.urgency_level.value
    is_severe = assessment.is_severe

    async with get_db_session() as db:
        # Get or link patient
        user, patient, _ = await get_or_create_telegram_user(
            db,
            chat_id=message.chat.id,
            full_name=message.from_user.full_name or "Patient",
            language=lang
        )

        # Log Triage Session
        try:
            triage_session = TriageSession(
                patient_id=patient.id,
                raw_symptoms=symptoms,
                urgency_level=urgency,
                channel="TELEGRAM",
                telegram_chat_id=message.chat.id,
                language=lang,
                ai_response=assessment.advisory_summary,
                recommended_specialty=assessment.recommended_specialty
            )
            db.add(triage_session)
            await db.commit()
        except Exception as e:
            await db.rollback()

        if is_severe:
            # 🔴 SEVERE CASE: Auto-generate an urgent doctor ticket on the Doctor Dashboard
            # Find closest/top facility
            fac_stmt = select(Facility).where(Facility.is_active == True).limit(1)
            fac_res = await db.execute(fac_stmt)
            facility = fac_res.scalars().first()
            fac_id = facility.id if facility else uuid.uuid4()
            fac_name = facility.name if facility else "AIIMS Delhi Emergency"

            # Find available doctor
            doc_stmt = select(Doctor).where(Doctor.facility_id == fac_id).limit(1)
            doc_res = await db.execute(doc_stmt)
            doctor = doc_res.scalars().first()
            doc_id = doctor.id if doctor else uuid.uuid4()
            doc_name = doctor.full_name if doctor else "Duty Emergency Physician"

            # Create Appointment
            now = datetime.now()
            appt = Appointment(
                patient_id=patient.id,
                facility_id=fac_id,
                doctor_id=doc_id,
                scheduled_start=now,
                scheduled_end=now + timedelta(minutes=30),
                status="SCHEDULED",
                consultation_type="IN_PERSON",
                chief_complaint=f"[URGENT TRIAGE] {symptoms}"
            )
            db.add(appt)
            await db.commit()
            await db.refresh(appt)


            # Create Queue Token
            token = await create_queue_token(db, appt.id)

            # Publish event to Doctor Dashboard & WebSockets
            await event_bus.publish(APPOINTMENT_CREATED, {
                "appointment_id": str(appt.id),
                "facility_id": str(fac_id),
                "doctor_id": str(doc_id),
                "telegram_chat_id": message.chat.id,
                "preferred_language": lang,
                "urgency": urgency
            })

            urgent_msg = get_text("urgent_ticket_created", lang).format(
                token=token.token_number,
                fac=fac_name,
                doc=doc_name,
                pos=token.position,
                eta=token.estimated_wait_minutes
            )

            is_emergency = urgency == "EMERGENCY"
            await message.answer(urgent_msg, parse_mode="Markdown", reply_markup=urgency_keyboard(is_emergency, lang))

        else:
            # 🟢 MILD / ROUTINE CASE: Do NOT create hospital ticket. Provide tailored health advice & doctor booking
            remedies = assessment.home_remedies
            remedies_text = "\n".join([f"• {r}" for r in remedies]) if remedies else "• Warm water hydration\n• Adequate rest and monitoring"

            response = (
                f"🟢 **{get_text('urgency', lang)}: {urgency}**\n\n"
                f"{assessment.advisory_summary}\n\n"
                f"{get_text('home_remedies_header', lang)}\n"
                f"{remedies_text}\n\n"
                f"_{assessment.mandatory_disclaimer}_"
            )

            await message.answer(response, parse_mode="Markdown", reply_markup=triage_mild_keyboard(lang))

    await event_bus.publish(TRIAGE_COMPLETED, {
        "channel": "TELEGRAM",
        "telegram_chat_id": message.chat.id,
        "patient_id": str(patient.id) if patient else None,
        "urgency": urgency,
        "is_severe": is_severe,
        "symptoms": symptoms
    })

    await state.clear()
    await state.update_data(language=lang)


@router.callback_query(F.data == "emergency_108_alert")
async def on_emergency_108(callback: CallbackQuery):
    await callback.message.answer("🚨 **EMERGENCY (108)**\nPlease dial **108** from your phone dialer immediately for emergency ambulance dispatch.", parse_mode="Markdown")
    await callback.answer()
