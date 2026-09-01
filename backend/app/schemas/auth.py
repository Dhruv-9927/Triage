import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: str = "PATIENT" # PATIENT, DOCTOR, FACILITY_ADMIN
    
    # Optional Doctor fields
    specialization: Optional[str] = "General Medicine"
    license_number: Optional[str] = None
    consultation_fee: Optional[float] = 350.0
    
    # Optional Facility Admin fields
    facility_name: Optional[str] = None
    facility_type: Optional[str] = "Hospital"
    facility_address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenPayload(BaseModel):
    sub: str
    role: str
    email: str
    exp: int
