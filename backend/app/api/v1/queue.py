from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.queue_token import QueueToken
from app.models.doctor import Doctor
from app.models.facility import Facility
from app.models.patient import Patient
from app.services.queue_service import get_queue_status, check_in_patient
import uuid

router = APIRouter()

@router.get("/my-tokens")
async def get_my_tokens(db: AsyncSession = Depends(get_db)):
    stmt = select(QueueToken).order_by(QueueToken.created_at.desc())
    result = await db.execute(stmt)
    tokens = result.scalars().all()

    enriched = []
    for t in tokens:
        doc = await db.get(Doctor, t.doctor_id)
        fac = await db.get(Facility, t.facility_id)
        pat = await db.get(Patient, t.patient_id)

        enriched.append({
            "id": str(t.id),
            "appointment_id": str(t.appointment_id),
            "token_number": t.token_number,
            "position": t.position,
            "estimated_wait_minutes": t.estimated_wait_minutes,
            "checked_in": t.checked_in,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "doctor_name": doc.full_name if doc else "Attending Clinician",
            "doctor_specialization": doc.specialization if doc else "General Medicine",
            "facility_name": fac.name if fac else "Healthcare Facility",
            "patient_name": pat.full_name if pat else "Priya Sharma"
        })
    return enriched

@router.get("/{token_id}")
async def get_token(token_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    token = await get_queue_status(db, token_id)
    doc = await db.get(Doctor, token.doctor_id)
    fac = await db.get(Facility, token.facility_id)

    return {
        "id": str(token.id),
        "appointment_id": str(token.appointment_id),
        "token_number": token.token_number,
        "position": token.position,
        "estimated_wait_minutes": token.estimated_wait_minutes,
        "checked_in": token.checked_in,
        "doctor_name": doc.full_name if doc else "Attending Clinician",
        "facility_name": fac.name if fac else "Healthcare Facility"
    }

@router.post("/advance")
async def advance_doctor_queue(
    doctor_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Calls the next patient in queue, completes current, and notifies remaining patients."""
    called_token = await advance_queue(db, doctor_id=doctor_id)
    if not called_token:
        return {"status": "empty", "message": "No patients waiting in queue"}

    doc = await db.get(Doctor, called_token.doctor_id)
    pat = await db.get(Patient, called_token.patient_id)
    return {
        "status": "advanced",
        "called_token_id": str(called_token.id),
        "token_number": called_token.token_number,
        "patient_name": pat.full_name if pat else "Patient",
        "doctor_name": doc.full_name if doc else "Doctor"
    }

@router.post("/{token_id}/complete")
async def complete_patient_token(
    token_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    token = await get_queue_status(db, token_id)
    token.status = 'COMPLETED'
    if token.appointment_id:
        appt = await db.get(Appointment, token.appointment_id)
        if appt:
            appt.status = 'COMPLETED'

    # Shift remaining waiting tokens for this doctor
    rem_stmt = select(QueueToken).where(
        QueueToken.doctor_id == token.doctor_id,
        QueueToken.status == "WAITING",
        QueueToken.id != token.id
    ).order_by(QueueToken.position, QueueToken.created_at)
    rem_res = await db.execute(rem_stmt)
    remaining_tokens = list(rem_res.scalars().all())

    for idx, t in enumerate(remaining_tokens, start=1):
        t.position = idx
        t.estimated_wait_minutes = idx * 15

    await db.commit()
    return {"status": "completed", "token_id": str(token.id)}

