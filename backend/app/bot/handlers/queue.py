import uuid
from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from sqlalchemy.future import select
from app.bot.bot import get_db_session
from app.bot.i18n import get_text
from app.services.user_linking_service import get_patient_by_chat_id
from app.services.queue_service import check_in_patient
from app.models.queue_token import QueueToken
from app.models.appointment import Appointment
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.triage_session import TriageSession

router = Router()


@router.callback_query(F.data == "menu_queue")
async def show_queue(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        patient = await get_patient_by_chat_id(db, callback.message.chat.id)
        if not patient:
            await callback.message.answer(get_text("no_active_queues", lang))
            return

        stmt = select(QueueToken).where(QueueToken.patient_id == patient.id, QueueToken.status == 'WAITING')
        result = await db.execute(stmt)
        tokens = result.scalars().all()

        if not tokens:
            await callback.message.answer(get_text("no_active_queues", lang))
            return

        for t in tokens:
            fac_name = "Health Center"
            doc_name = "Consultant"
            if t.appointment_id:
                appt_stmt = select(Appointment).where(Appointment.id == t.appointment_id)
                appt_res = await db.execute(appt_stmt)
                appt = appt_res.scalars().first()
                if appt:
                    f_stmt = select(Facility).where(Facility.id == appt.facility_id)
                    f_res = await db.execute(f_stmt)
                    f_obj = f_res.scalars().first()
                    if f_obj:
                        fac_name = f_obj.name

                    d_stmt = select(Doctor).where(Doctor.id == appt.doctor_id)
                    d_res = await db.execute(d_stmt)
                    d_obj = d_res.scalars().first()
                    if d_obj:
                        doc_name = d_obj.full_name

            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=get_text("check_in_btn", lang), callback_data=f"checkin_{t.id}")]
            ])
            msg = get_text("queue_card", lang).format(
                token=t.token_number,
                fac=fac_name,
                doc=doc_name,
                pos=t.position,
                eta=t.estimated_wait_minutes
            )
            await callback.message.answer(msg, reply_markup=kb)


@router.callback_query(F.data.startswith("checkin_"))
async def handle_check_in(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')
    token_id = callback.data.split('_')[1]

    async with get_db_session() as db:
        await check_in_patient(db, uuid.UUID(token_id))

    await callback.message.answer(get_text("check_in_success", lang))


@router.callback_query(F.data == "menu_records")
async def show_health_records(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()
    lang = data.get('language', 'en')

    async with get_db_session() as db:
        patient = await get_patient_by_chat_id(db, callback.message.chat.id)
        if not patient:
            await callback.message.answer("📋 No health records found yet. Try checking symptoms or booking a consultation!")
            return

        stmt = select(TriageSession).where(TriageSession.patient_id == patient.id).order_by(TriageSession.created_at.desc()).limit(3)
        result = await db.execute(stmt)
        sessions = result.scalars().all()

        if not sessions:
            await callback.message.answer("📋 No previous triage assessments found for your profile.")
            return

        records_text = "📋 **Your Recent Health Records:**\n\n"
        for s in sessions:
            date_str = s.created_at.strftime("%d %b %Y, %I:%M %p") if s.created_at else "Recent"
            records_text += (
                f"• **{date_str}**\n"
                f"  Symptoms: _{s.raw_symptoms}_\n"
                f"  Urgency: `{s.urgency_level}`\n\n"
            )

        await callback.message.answer(records_text, parse_mode="Markdown")
