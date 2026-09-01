import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException
from app.models.queue_token import QueueToken
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.services.event_bus import event_bus, TOKEN_CREATED, QUEUE_ADVANCED, QUEUE_CHECKED_IN


async def create_queue_token(db: AsyncSession, appointment_id: uuid.UUID) -> QueueToken:
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    date_str = datetime.now().strftime("%Y%m%d")

    # Generate sequential token number across the system
    total_stmt = select(func.count(QueueToken.id))
    total_res = await db.execute(total_stmt)
    total_count = total_res.scalar() or 0
    token_str = f"TKN-{date_str}-{total_count + 1:03d}"

    # Calculate queue position: count how many WAITING tokens exist for this doctor
    waiting_stmt = select(func.count(QueueToken.id)).where(
        QueueToken.doctor_id == appointment.doctor_id,
        QueueToken.status == "WAITING"
    )
    waiting_res = await db.execute(waiting_stmt)
    waiting_count = waiting_res.scalar() or 0
    position = waiting_count + 1

    token = QueueToken(
        patient_id=appointment.patient_id,
        appointment_id=appointment_id,
        facility_id=appointment.facility_id,
        doctor_id=appointment.doctor_id,
        token_number=token_str,
        position=position,
        estimated_wait_minutes=position * 15,
        status="WAITING",
        checked_in=True
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)

    await event_bus.publish(TOKEN_CREATED, {
        "token_id": str(token.id),
        "facility_id": str(appointment.facility_id),
        "doctor_id": str(appointment.doctor_id),
        "token_number": token_str,
        "position": position
    })

    return token


async def get_active_tokens_for_patient(db: AsyncSession, patient_id: uuid.UUID) -> List[QueueToken]:
    stmt = select(QueueToken).where(
        QueueToken.patient_id == patient_id,
        QueueToken.status == "WAITING"
    ).order_by(QueueToken.position)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_queue_status(db: AsyncSession, token_id: uuid.UUID) -> QueueToken:
    stmt = select(QueueToken).where(QueueToken.id == token_id)
    result = await db.execute(stmt)
    token = result.scalars().first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    return token


async def advance_queue(db: AsyncSession, doctor_id: Optional[uuid.UUID] = None) -> Optional[QueueToken]:
    """Advances the queue by completing the current patient and shifting all subsequent patients forward."""
    stmt = select(QueueToken).where(QueueToken.status == "WAITING")
    if doctor_id:
        stmt = stmt.where(QueueToken.doctor_id == doctor_id)
    stmt = stmt.order_by(QueueToken.position, QueueToken.created_at).limit(1)

    result = await db.execute(stmt)
    called_token = result.scalars().first()

    if not called_token:
        return None

    # Mark the first patient's token as COMPLETED
    called_token.status = 'COMPLETED'
    effective_doctor_id = called_token.doctor_id

    # Find all remaining WAITING tokens for this doctor
    rem_stmt = select(QueueToken).where(
        QueueToken.doctor_id == effective_doctor_id,
        QueueToken.status == "WAITING",
        QueueToken.id != called_token.id
    ).order_by(QueueToken.position, QueueToken.created_at)
    rem_res = await db.execute(rem_stmt)
    remaining_tokens = list(rem_res.scalars().all())

    # Re-index positions: 1, 2, 3, ...
    for idx, token in enumerate(remaining_tokens, start=1):
        token.position = idx
        token.estimated_wait_minutes = idx * 15

    await db.commit()

    # Notify all remaining patients on Telegram about their new queue position
    for token in remaining_tokens:
        patient_stmt = select(User).join(Patient, Patient.user_id == User.id).where(Patient.id == token.patient_id)
        p_res = await db.execute(patient_stmt)
        user = p_res.scalars().first()

        payload = {
            "token_id": str(token.id),
            "token_number": token.token_number,
            "facility_id": str(token.facility_id),
            "position": token.position,
            "estimated_wait_minutes": token.estimated_wait_minutes
        }
        if user and user.telegram_chat_id:
            payload["telegram_chat_id"] = user.telegram_chat_id
            payload["preferred_language"] = user.preferred_language or "en"

        await event_bus.publish(QUEUE_ADVANCED, payload)

    return called_token


async def check_in_patient(db: AsyncSession, token_id: uuid.UUID) -> QueueToken:
    token = await get_queue_status(db, token_id)
    token.checked_in = True
    await db.commit()
    await db.refresh(token)

    await event_bus.publish(QUEUE_CHECKED_IN, {
        "token_id": str(token.id),
        "facility_id": str(token.facility_id)
    })

    return token
