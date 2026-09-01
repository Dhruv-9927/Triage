from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.triage import SymptomInput, TriageResponse, TriageAssessment
from app.services.triage_service import assess_symptoms
from app.services.hospital_discovery_service import fetch_real_nearby_hospitals
from app.models.triage_session import TriageSession
from app.models.patient import Patient
import uuid
import json

router = APIRouter()

@router.post("/assess")
async def assess(input_data: SymptomInput, db: AsyncSession = Depends(get_db)):
    assessment: TriageAssessment = await assess_symptoms(input_data.symptoms, input_data.language)
    
    session = TriageSession(
        patient_id=input_data.patient_id,
        channel=input_data.channel,
        telegram_chat_id=input_data.telegram_chat_id,
        language=input_data.language,
        raw_symptoms=input_data.symptoms,
        urgency_level=assessment.urgency_level.value,
        red_flags_detected=assessment.red_flags_present,
        ai_response=json.dumps(assessment.model_dump()),
        recommended_specialty=assessment.recommended_specialty
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    user_lat = input_data.latitude or 28.6139
    user_lon = input_data.longitude or 77.2090
    
    # Dynamically fetch real OpenStreetMap hospitals near user's GPS coordinates!
    facilities = await fetch_real_nearby_hospitals(
        db,
        latitude=user_lat,
        longitude=user_lon,
        radius_km=25.0,
        specialty=assessment.recommended_specialty or "General Medicine"
    )
    
    return {
        "session_id": str(session.id),
        "assessment": assessment.model_dump(),
        "facilities": facilities
    }

from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TriageSession)
        .options(selectinload(TriageSession.patient).selectinload(Patient.user))
        .order_by(TriageSession.created_at.desc())
    )
    res = await db.execute(stmt)
    sessions = res.scalars().all()

    out = []
    for s in sessions:
        p_name = "Telegram Patient"
        if s.patient:
            p_name = s.patient.full_name or (s.patient.user.full_name if s.patient.user else "Patient")
        
        out.append({
            "id": str(s.id),
            "patient_id": str(s.patient_id) if s.patient_id else None,
            "patient_name": p_name,
            "channel": s.channel or "TELEGRAM",
            "telegram_chat_id": s.telegram_chat_id,
            "language": s.language or "en",
            "raw_symptoms": s.raw_symptoms,
            "urgency_level": s.urgency_level or "ROUTINE",
            "red_flags_detected": s.red_flags_detected,
            "ai_response": s.ai_response,
            "recommended_specialty": s.recommended_specialty or "General Medicine",
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return out
