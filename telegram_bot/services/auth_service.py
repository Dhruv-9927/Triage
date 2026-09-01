import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, Token
from app.security.password import hash_password, verify_password
from app.security.jwt_handler import create_access_token
from app.schemas.auth import UserResponse

async def register_user(db: AsyncSession, user_data: UserRegister) -> Token:
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hashed_pwd,
        role=user_data.role,
        full_name=user_data.full_name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token_payload = {"sub": str(new_user.id), "role": new_user.role, "email": new_user.email}
    access_token = create_access_token(token_payload)
    
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(new_user))

async def login_user(db: AsyncSession, email: str, password: str) -> Token:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_payload = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token = create_access_token(token_payload)
    
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()
