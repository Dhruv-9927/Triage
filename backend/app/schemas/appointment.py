import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID
    facility_id: uuid.UUID
    scheduled_start: datetime
    scheduled_end: datetime
    consultation_type: str = "IN_PERSON"
    chief_complaint: Optional[str] = None
    triage_session_id: Optional[uuid.UUID] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    facility_id: uuid.UUID
    triage_session_id: Optional[uuid.UUID]
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    consultation_type: str
    chief_complaint: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}
