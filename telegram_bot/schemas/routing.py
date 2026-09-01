from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.triage import UrgencyLevel
from app.schemas.facility import FacilityAvailability

class RoutingRequest(BaseModel):
    latitude: float = 28.6139
    longitude: float = 77.2090
    urgency_level: UrgencyLevel = UrgencyLevel.ROUTINE
    recommended_specialty: str = "General Medicine"
    potential_categories: List[str] = Field(default_factory=lambda: ["General"])
    radius_km: float = 50.0

class RoutingResponse(BaseModel):
    facilities: List[FacilityAvailability]
    emergency_numbers: Optional[List[str]] = None
