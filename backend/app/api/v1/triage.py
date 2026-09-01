from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.triage import SymptomInput, TriageResponse, TriageAssessment
from app.services.triage_service import assess_symptoms
from app.services.hospital_discovery_service import fetch_real_nearby_hospitals
from app.models.triage_session import TriageSession
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

@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    return []
