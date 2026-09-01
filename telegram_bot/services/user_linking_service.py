import random
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.models.user import User
from app.models.patient import Patient
from app.services.auth_service import hash_password


async def get_patient_by_chat_id(db: AsyncSession, chat_id: int) -> Patient | None:
    stmt = select(Patient).join(User, Patient.user_id == User.id).where(User.telegram_chat_id == chat_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_user_by_chat_id(db: AsyncSession, chat_id: int) -> User | None:
    stmt = select(User).where(User.telegram_chat_id == chat_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def link_telegram_account(db: AsyncSession, telegram_chat_id: int, phone_or_email: str) -> User:
    stmt = select(User).where(
        or_(User.email == phone_or_email, User.phone == phone_or_email)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        user.telegram_chat_id = telegram_chat_id
        await db.commit()
        await db.refresh(user)
        return user
    raise ValueError("User not found")


async def get_or_create_telegram_user(
    db: AsyncSession,
    chat_id: int,
    full_name: str,
    phone: str = None,
    language: str = 'en'
) -> tuple[User, Patient, bool]:
    # 1. Check by telegram_chat_id
    user = await get_user_by_chat_id(db, chat_id)
    if user:
        stmt = select(Patient).where(Patient.user_id == user.id)
        result = await db.execute(stmt)
        patient = result.scalars().first()
        if not patient:
            patient = Patient(user_id=user.id, full_name=user.full_name or full_name, dob=datetime.now().date(), gender="Other")
            db.add(patient)
            await db.commit()
            await db.refresh(patient)
        return (user, patient, False)

    # 2. Check by phone number if provided
    if phone:
        phone_stmt = select(User).where(User.phone == phone)
        phone_res = await db.execute(phone_stmt)
        existing_user = phone_res.scalars().first()
        if existing_user:
            existing_user.telegram_chat_id = chat_id
            existing_user.preferred_language = language
            await db.commit()
            p_stmt = select(Patient).where(Patient.user_id == existing_user.id)
            p_res = await db.execute(p_stmt)
            patient = p_res.scalars().first()
            if not patient:
                patient = Patient(user_id=existing_user.id, full_name=existing_user.full_name or full_name, dob=datetime.now().date(), gender="Other")
                db.add(patient)
                await db.commit()
                await db.refresh(patient)
            return (existing_user, patient, False)

    # 3. Create fresh new user
    random_suffix = random.randint(1000, 9999)
    email = f"tg_{chat_id}_{random_suffix}@sehat.local"
    password = f"random_{uuid.uuid4().hex}"

    new_user = User(
        email=email,
        phone=phone,
        hashed_password=hash_password(password),
        role="PATIENT",
        full_name=full_name,
        telegram_chat_id=chat_id,
        preferred_language=language
    )
    db.add(new_user)
    await db.flush()

    new_patient = Patient(
        user_id=new_user.id,
        full_name=full_name,
        dob=datetime.now().date(),
        gender="Other"
    )
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_user)
    await db.refresh(new_patient)

    return (new_user, new_patient, True)


async def update_language_preference(db: AsyncSession, chat_id: int, language: str) -> None:
    user = await get_user_by_chat_id(db, chat_id)
    if user:
        user.preferred_language = language
        await db.commit()
