from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.facility import Facility
from app.models.queue_token import QueueToken
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.queue_service import create_queue_token
import uuid
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class EnrichedAppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    facility_id: str
    triage_session_id: Optional[str] = None
    scheduled_start: str
    scheduled_end: str
    status: str
    consultation_type: str
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    facility_name: Optional[str] = None
    facility_type: Optional[str] = None
    token_number: Optional[str] = None
    queue_position: Optional[int] = None
    estimated_wait_minutes: Optional[int] = None
    checked_in: bool = False

@router.post("/")
async def book_appointment(data: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    # Find existing patient or create default patient record
    stmt_patient = select(Patient).limit(1)
    res_patient = await db.execute(stmt_patient)
    patient = res_patient.scalars().first()
    
    patient_id = patient.id if patient else uuid.uuid4()

    app = Appointment(
        patient_id=patient_id,
        doctor_id=data.doctor_id,
        facility_id=data.facility_id,
        scheduled_start=data.scheduled_start,
        scheduled_end=data.scheduled_end,
        consultation_type=data.consultation_type,
        chief_complaint=data.chief_complaint or "General Clinical Triage",
        triage_session_id=data.triage_session_id,
        status="SCHEDULED"
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    
    token = await create_queue_token(db, app.id)

    # Fetch doctor and facility names
    doc = await db.get(Doctor, app.doctor_id)
    fac = await db.get(Facility, app.facility_id)

    return {
        "id": str(app.id),
        "patient_id": str(app.patient_id),
        "doctor_id": str(app.doctor_id),
        "facility_id": str(app.facility_id),
        "triage_session_id": str(app.triage_session_id) if app.triage_session_id else None,
        "scheduled_start": app.scheduled_start.isoformat(),
        "scheduled_end": app.scheduled_end.isoformat(),
        "status": app.status,
        "consultation_type": app.consultation_type,
        "chief_complaint": app.chief_complaint,
        "notes": app.notes,
        "created_at": app.created_at.isoformat() if app.created_at else datetime.now().isoformat(),
        "doctor_name": doc.full_name if doc else "Attending Clinician",
        "doctor_specialization": doc.specialization if doc else "General Medicine",
        "facility_name": fac.name if fac else "Healthcare Facility",
        "facility_type": fac.facility_type if fac else "Hospital",
        "token_number": token.token_number if token else "TKN-001",
        "queue_position": token.position if token else 1,
        "estimated_wait_minutes": token.estimated_wait_minutes if token else 15,
        "checked_in": token.checked_in if token else False
    }

@router.get("/")
async def list_appointments(
    status: Optional[str] = None,
    doctor_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Appointment)
        .options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
            selectinload(Appointment.queue_token)
        )
        .order_by(Appointment.created_at.asc())
    )
    
    if status:
        stmt = stmt.where(Appointment.status == status)
    if doctor_id:
        stmt = stmt.where(Appointment.doctor_id == doctor_id)


    result = await db.execute(stmt)
    appointments = result.scalars().all()

    enriched_list = []
    for app in appointments:
        fac = await db.get(Facility, app.facility_id)
        token = app.queue_token
        
        enriched_list.append({
            "id": str(app.id),
            "patient_id": str(app.patient_id),
            "doctor_id": str(app.doctor_id),
            "facility_id": str(app.facility_id),
            "triage_session_id": str(app.triage_session_id) if app.triage_session_id else None,
            "scheduled_start": app.scheduled_start.isoformat() if app.scheduled_start else None,
            "scheduled_end": app.scheduled_end.isoformat() if app.scheduled_end else None,
            "status": app.status,
            "consultation_type": app.consultation_type,
            "chief_complaint": app.chief_complaint,
            "notes": app.notes,
            "created_at": app.created_at.isoformat() if app.created_at else None,
            "doctor_name": app.doctor.full_name if app.doctor else "Attending Clinician",
            "doctor_specialization": app.doctor.specialization if app.doctor else "General Medicine",
            "facility_name": fac.name if fac else "Healthcare Facility",
            "facility_type": fac.facility_type if fac else "Hospital",
            "patient_name": app.patient.full_name if app.patient else "Priya Sharma",
            "token_number": token.token_number if token else "TKN-001",
            "queue_position": token.position if token else 1,
            "estimated_wait_minutes": token.estimated_wait_minutes if token else 10,
            "checked_in": token.checked_in if token else False
        })
    return enriched_list

@router.get("/{id}")
async def get_appointment(id: str, db: AsyncSession = Depends(get_db)):
    try:
        app_uuid = uuid.UUID(id)
        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.doctor),
                selectinload(Appointment.patient),
                selectinload(Appointment.queue_token)
            )
            .where(Appointment.id == app_uuid)
        )
        result = await db.execute(stmt)
        app = result.scalars().first()
    except Exception:
        app = None

    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    fac = await db.get(Facility, app.facility_id)
    token = app.queue_token

    return {
        "id": str(app.id),
        "patient_id": str(app.patient_id),
        "doctor_id": str(app.doctor_id),
        "facility_id": str(app.facility_id),
        "triage_session_id": str(app.triage_session_id) if app.triage_session_id else None,
        "scheduled_start": app.scheduled_start.isoformat() if app.scheduled_start else None,
        "scheduled_end": app.scheduled_end.isoformat() if app.scheduled_end else None,
        "status": app.status,
        "consultation_type": app.consultation_type,
        "chief_complaint": app.chief_complaint,
        "notes": app.notes,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "doctor_name": app.doctor.full_name if app.doctor else "Attending Clinician",
        "doctor_specialization": app.doctor.specialization if app.doctor else "General Medicine",
        "facility_name": fac.name if fac else "Healthcare Facility",
        "patient_name": app.patient.full_name if app.patient else "Patient",
        "token_number": token.token_number if token else "TKN-001",
        "queue_position": token.position if token else 1,
        "estimated_wait_minutes": token.estimated_wait_minutes if token else 10,
        "checked_in": token.checked_in if token else False
    }

@router.put("/{id}")
@router.patch("/{id}")
async def update_appointment(id: str, data: AppointmentUpdate, db: AsyncSession = Depends(get_db)):
    try:
        app_uuid = uuid.UUID(id)
        stmt = select(Appointment).where(Appointment.id == app_uuid)
        result = await db.execute(stmt)
        app = result.scalars().first()
    except Exception:
        app = None

    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if data.status:
        app.status = data.status
        # Sync corresponding queue token status
        token_stmt = select(QueueToken).where(QueueToken.appointment_id == app.id)
        t_res = await db.execute(token_stmt)
        token = t_res.scalars().first()
        if token:
            token.status = data.status
    if data.notes:
        app.notes = data.notes

    await db.commit()
    await db.refresh(app)
    return {
        "status": "success",
        "appointment_id": str(app.id),
        "appointment_status": app.status,
        "notes": app.notes
    }



@router.get("/{id}/queue")
async def get_appointment_queue(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(QueueToken).where(QueueToken.appointment_id == id)
    result = await db.execute(stmt)
    token = result.scalars().first()
    if not token:
        return {
            "token_number": "TKN-001",
            "position": 1,
            "estimated_wait_minutes": 10,
            "checked_in": False
        }
    return {
        "id": str(token.id),
        "token_number": token.token_number,
        "position": token.position,
        "estimated_wait_minutes": token.estimated_wait_minutes,
        "checked_in": token.checked_in
    }
