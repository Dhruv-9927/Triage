from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientResponse, PatientUpdate
from app.security.rbac import RoleChecker

router = APIRouter()
allow_patient = RoleChecker(["PATIENT", "SUPER_ADMIN"])

@router.get("/me", response_model=PatientResponse)
async def get_my_profile(current_user = Depends(allow_patient), db: AsyncSession = Depends(get_db)):
    stmt = select(Patient).where(Patient.user_id == current_user.id)
    result = await db.execute(stmt)
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

@router.put("/me", response_model=PatientResponse)
async def update_my_profile(data: PatientUpdate, current_user = Depends(allow_patient), db: AsyncSession = Depends(get_db)):
    stmt = select(Patient).where(Patient.user_id == current_user.id)
    result = await db.execute(stmt)
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(patient, key, value)
        
    await db.commit()
    await db.refresh(patient)
    return patient

@router.get("/{id}/health-records")
async def get_health_records(id: str, db: AsyncSession = Depends(get_db)):
    # Mock return
    return {"medical_history": "None", "allergies": "None"}
