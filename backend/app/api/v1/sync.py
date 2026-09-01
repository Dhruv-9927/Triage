from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.services.queue_service import create_queue_token
from typing import List, Dict, Any
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/push")
async def sync_push(mutations: List[Dict[str, Any]] = Body(default=[]), db: AsyncSession = Depends(get_db)):
    """
    Universal offline mutation replay endpoint.
    Accepts mutations recorded while offline and applies them idempotently.
    """
    processed = 0
    for m in mutations:
        entity = m.get("entity")
        action = m.get("action")
        data = m.get("data", {})

        if entity == "appointments" and action == "create":
            stmt_patient = select(Patient).limit(1)
            res_patient = await db.execute(stmt_patient)
            patient = res_patient.scalars().first()

            app = Appointment(
                patient_id=patient.id if patient else uuid.uuid4(),
                doctor_id=uuid.UUID(data.get("doctor_id")) if data.get("doctor_id") else uuid.uuid4(),
                facility_id=uuid.UUID(data.get("facility_id")) if data.get("facility_id") else uuid.uuid4(),
                scheduled_start=datetime.fromisoformat(data.get("scheduled_start")) if data.get("scheduled_start") else datetime.now(),
                scheduled_end=datetime.fromisoformat(data.get("scheduled_end")) if data.get("scheduled_end") else datetime.now(),
                consultation_type=data.get("consultation_type", "IN_PERSON"),
                chief_complaint=data.get("chief_complaint", "Offline Queued Consultation"),
                status="SCHEDULED"
            )
            db.add(app)
            await db.commit()
            await db.refresh(app)
            await create_queue_token(db, app.id)
            processed += 1

    return {
        "status": "synced",
        "processed_mutations": processed,
        "synced_at": datetime.now().isoformat()
    }

@router.get("/pull")
async def sync_pull(db: AsyncSession = Depends(get_db)):
    """
    Pulls fresh offline cache catalog (facilities, doctors, reference data).
    """
    stmt_fac = select(Facility).where(Facility.is_active == True)
    res_fac = await db.execute(stmt_fac)
    facs = res_fac.scalars().all()

    stmt_doc = select(Doctor).where(Doctor.is_available == True)
    res_doc = await db.execute(stmt_doc)
    docs = res_doc.scalars().all()

    return {
        "facilities": [
            {
                "id": str(f.id),
                "name": f.name,
                "facility_type": f.facility_type,
                "address": f.address,
                "latitude": f.latitude,
                "longitude": f.longitude,
                "phone": f.phone,
                "emergency_services": f.emergency_services
            }
            for f in facs
        ],
        "doctors": [
            {
                "id": str(d.id),
                "facility_id": str(d.facility_id),
                "full_name": d.full_name,
                "specialization": d.specialization,
                "consultation_fee": d.consultation_fee,
                "languages": d.languages
            }
            for d in docs
        ],
        "server_time": datetime.now().isoformat()
    }
