from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorResponse
from app.security.rbac import RoleChecker
import uuid

router = APIRouter()

@router.get("/", response_model=List[DoctorResponse])
async def list_doctors(db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor).where(Doctor.is_available == True)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=DoctorResponse)
async def get_doctor(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor).where(Doctor.id == id)
    result = await db.execute(stmt)
    doctor = result.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.patch("/{id}/availability")
async def toggle_availability(id: uuid.UUID, available: bool, current_user = Depends(RoleChecker(["DOCTOR", "FACILITY_ADMIN"])), db: AsyncSession = Depends(get_db)):
    stmt = select(Doctor).where(Doctor.id == id)
    result = await db.execute(stmt)
    doctor = result.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.is_available = available
    await db.commit()
    return {"status": "success"}
