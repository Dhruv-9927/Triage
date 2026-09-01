import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.doctor import DoctorResponse

class FacilityCreate(BaseModel):
    name: str
    facility_type: str
    address: str
    latitude: float
    longitude: float
    phone: str
    email: Optional[str] = None
    emergency_services: bool = False
    operating_hours: Optional[str] = None

class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    facility_type: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_services: Optional[bool] = None
    operating_hours: Optional[str] = None
    is_active: Optional[bool] = None

class FacilityResponse(BaseModel):
    id: uuid.UUID
    name: str
    facility_type: str
    address: str
    latitude: float
    longitude: float
    phone: str
    email: Optional[str]
    emergency_services: bool
    operating_hours: Optional[str]
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

class FacilityAvailability(BaseModel):
    facility: FacilityResponse
    available_doctors: List[DoctorResponse]
    available_beds: Dict[str, Any]
    medicine_availability: List[Dict[str, Any]]
    distance_km: float
    composite_score: float
