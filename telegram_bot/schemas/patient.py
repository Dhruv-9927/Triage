import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class PatientCreate(BaseModel):
    full_name: str
    dob: date
    gender: str
    blood_group: Optional[str] = None
    abha_id: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    abha_id: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None

class PatientResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    dob: date
    gender: str
    blood_group: Optional[str]
    abha_id: Optional[str]
    emergency_contact_phone: Optional[str]
    medical_history: Optional[str]
    allergies: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}
