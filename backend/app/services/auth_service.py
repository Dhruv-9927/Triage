import uuid
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.facility import Facility
from app.models.bed import Bed
from app.models.medicine import MedicineInventory
from app.schemas.auth import UserRegister, Token, UserResponse
from app.security.password import hash_password, verify_password
from app.security.jwt_handler import create_access_token

async def register_user(db: AsyncSession, user_data: UserRegister) -> Token:
    # Check if email already exists
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        phone=user_data.phone or None,
        hashed_password=hashed_pwd,
        role=user_data.role.upper(),
        full_name=user_data.full_name,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 1. If Patient, create Patient profile
    if new_user.role == "PATIENT":
        patient = Patient(
            user_id=new_user.id,
            full_name=new_user.full_name,
            dob=date(1995, 1, 1),
            gender="FEMALE",
            blood_group="O+",
            abha_id="1234-5678-9012",
            emergency_contact_phone=new_user.phone
        )
        db.add(patient)
        await db.commit()

    # 2. If Doctor, create Doctor profile and link to first facility
    elif new_user.role == "DOCTOR":
        stmt_fac = select(Facility).limit(1)
        res_fac = await db.execute(stmt_fac)
        fac = res_fac.scalars().first()

        doctor = Doctor(
            user_id=new_user.id,
            facility_id=fac.id if fac else None,
            full_name=new_user.full_name,
            specialization=user_data.specialization or "General Medicine",
            license_number=user_data.license_number or f"MCI-{str(uuid.uuid4().int)[:6]}",
            is_available=True,
            consultation_fee=user_data.consultation_fee or 350.0,
            experience_years=8,
            languages="Hindi, English"
        )
        db.add(doctor)
        await db.commit()

    # 3. If Facility Admin, create Facility
    elif new_user.role == "FACILITY_ADMIN":
        fac_name = user_data.facility_name or f"{new_user.full_name}'s Healthcare Centre"
        facility = Facility(
            name=fac_name,
            facility_type=user_data.facility_type or "Hospital",
            address=user_data.facility_address or "Main Healthcare Road, Sector 12",
            latitude=28.6139,
            longitude=77.2090,
            phone=new_user.phone or "011-26588500",
            email=new_user.email,
            emergency_services=True,
            operating_hours="24/7",
            is_active=True
        )
        db.add(facility)
        await db.commit()
        await db.refresh(facility)

        # Seed initial beds
        for b_i in range(1, 6):
            db.add(Bed(facility_id=facility.id, ward_name="General Ward", bed_number=f"GW-{b_i:02d}", bed_type="GENERAL", status="AVAILABLE"))
        for b_i in range(1, 3):
            db.add(Bed(facility_id=facility.id, ward_name="ICU Block", bed_number=f"ICU-{b_i:02d}", bed_type="ICU", status="AVAILABLE"))

        await db.commit()

    # Issue JWT Token
    token_payload = {"sub": str(new_user.id), "role": new_user.role, "email": new_user.email}
    access_token = create_access_token(token_payload)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

async def login_user(db: AsyncSession, email: str, password: str) -> Token:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token_payload = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token = create_access_token(token_payload)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()
