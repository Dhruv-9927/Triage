import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DoctorCreate(BaseModel):
    facility_id: Optional[uuid.UUID] = None
    full_name: str
    specialization: str
    license_number: str
    consultation_fee: float = 0
    experience_years: int = 0
    languages: Optional[str] = None

class DoctorUpdate(BaseModel):
    facility_id: Optional[uuid.UUID] = None
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    is_available: Optional[bool] = None
    consultation_fee: Optional[float] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None

class DoctorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    facility_id: Optional[uuid.UUID]
    full_name: str
    specialization: str
    license_number: str
    is_available: bool
    consultation_fee: float
    experience_years: int
    languages: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}
