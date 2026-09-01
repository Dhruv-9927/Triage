import math
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.facility import Facility
from app.schemas.routing import RoutingRequest
from app.schemas.facility import FacilityAvailability
from app.schemas.doctor import DoctorResponse
from app.schemas.triage import UrgencyLevel

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def find_best_facilities(db: AsyncSession, request: RoutingRequest) -> List[FacilityAvailability]:
    stmt = select(Facility).options(
        selectinload(Facility.doctors),
        selectinload(Facility.beds),
        selectinload(Facility.medicine_inventory)
    ).where(Facility.is_active == True)
    
    if request.urgency_level == UrgencyLevel.EMERGENCY:
        stmt = stmt.where(Facility.emergency_services == True)
        
    result = await db.execute(stmt)
    facilities = result.scalars().all()
    
    availabilities = []
    for facility in facilities:
        dist = haversine(request.latitude, request.longitude, facility.latitude, facility.longitude)
        if dist > request.radius_km:
            continue
            
        matching_doctors = [d for d in facility.doctors if d.specialization == request.recommended_specialty and d.is_available]
        available_beds = {}
        for b in facility.beds:
            if b.status == "AVAILABLE":
                available_beds[b.bed_type] = available_beds.get(b.bed_type, 0) + 1
                
        medicines = [{"name": m.medicine_name, "quantity": m.quantity_available} for m in facility.medicine_inventory if m.quantity_available > 0]
        
        score = (len(matching_doctors) * 40) + (sum(available_beds.values()) * 30) + (len(medicines) * 20) - (dist * 10)
        
        availabilities.append(FacilityAvailability(
            facility=facility,
            available_doctors=[DoctorResponse.model_validate(d) for d in matching_doctors],
            available_beds=available_beds,
            medicine_availability=medicines,
            distance_km=round(dist, 2),
            composite_score=score
        ))
        
    availabilities.sort(key=lambda x: x.composite_score, reverse=True)
    return availabilities[:3]
