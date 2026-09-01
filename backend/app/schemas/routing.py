from typing import Optional, List
from pydantic import BaseModel
from app.schemas.triage import UrgencyLevel
from app.schemas.facility import FacilityAvailability

class RoutingRequest(BaseModel):
    latitude: float
    longitude: float
    urgency_level: UrgencyLevel
    recommended_specialty: str
    potential_categories: List[str]
    radius_km: float = 50.0

class RoutingResponse(BaseModel):
    facilities: List[FacilityAvailability]
    emergency_numbers: Optional[List[str]] = None
