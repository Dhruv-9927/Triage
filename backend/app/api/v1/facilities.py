from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.facility import Facility
from app.models.bed import Bed
from app.models.medicine import MedicineInventory
from app.schemas.facility import FacilityResponse
from app.websockets.manager import manager
import uuid
from pydantic import BaseModel

router = APIRouter()

class BedStatusUpdate(BaseModel):
    status: str

class MedicineQtyUpdate(BaseModel):
    quantity_available: int

class DiscoverRequest(BaseModel):
    latitude: float = 28.6139
    longitude: float = 77.2090
    radius_km: float = 25.0
    specialty: Optional[str] = "General Medicine"

class RouteRequest(BaseModel):
    symptoms: str
    urgency_level: str = "ROUTINE"
    recommended_specialty: Optional[str] = "General Medicine"
    latitude: float = 28.6139
    longitude: float = 77.2090

from app.services.hospital_discovery_service import fetch_real_nearby_hospitals

@router.post("/discover")
async def discover_real_hospitals(req: DiscoverRequest, db: AsyncSession = Depends(get_db)):
    results = await fetch_real_nearby_hospitals(
        db,
        latitude=req.latitude,
        longitude=req.longitude,
        radius_km=req.radius_km,
        specialty=req.specialty or "General Medicine"
    )
    return results

@router.get("/", response_model=List[FacilityResponse])
async def list_facilities(db: AsyncSession = Depends(get_db)):
    stmt = select(Facility).where(Facility.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}", response_model=FacilityResponse)
async def get_facility(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Facility).where(Facility.id == id)
    result = await db.execute(stmt)
    facility = result.scalars().first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility

@router.get("/{id}/beds")
async def get_facility_beds(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Bed).where(Bed.facility_id == id)
    result = await db.execute(stmt)
    beds = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "facility_id": str(b.facility_id),
            "ward_name": b.ward_name,
            "bed_number": b.bed_number,
            "bed_type": b.bed_type,
            "status": b.status,
            "version": b.version,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None
        }
        for b in beds
    ]

@router.patch("/{id}/beds/{bed_id}")
async def update_bed(id: uuid.UUID, bed_id: uuid.UUID, data: BedStatusUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Bed).where(Bed.id == bed_id, Bed.facility_id == id)
    result = await db.execute(stmt)
    bed = result.scalars().first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    bed.status = data.status
    bed.version += 1
    await db.commit()
    await db.refresh(bed)

    # Broadcast live status over WebSockets
    await manager.broadcast(str(id), {
        "event": "bed_updated",
        "bed_id": str(bed.id),
        "bed_number": bed.bed_number,
        "ward": bed.ward_name,
        "status": bed.status,
        "version": bed.version
    })

    return {
        "status": "success",
        "bed": {
            "id": str(bed.id),
            "status": bed.status,
            "version": bed.version
        }
    }

@router.get("/{id}/medicines")
async def get_facility_medicines(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(MedicineInventory).where(MedicineInventory.facility_id == id)
    result = await db.execute(stmt)
    meds = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "facility_id": str(m.facility_id),
            "medicine_name": m.medicine_name,
            "generic_name": m.generic_name,
            "category": m.category,
            "batch_number": m.batch_number,
            "quantity_available": m.quantity_available,
            "reorder_level": m.reorder_level,
            "is_essential": m.is_essential,
            "expiry_date": m.expiry_date.isoformat() if m.expiry_date else None,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None
        }
        for m in meds
    ]

@router.patch("/{id}/medicines/{med_id}")
async def update_medicine(id: uuid.UUID, med_id: uuid.UUID, data: MedicineQtyUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(MedicineInventory).where(MedicineInventory.id == med_id, MedicineInventory.facility_id == id)
    result = await db.execute(stmt)
    med = result.scalars().first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    med.quantity_available = data.quantity_available
    await db.commit()
    await db.refresh(med)

    # Broadcast live status over WebSockets
    await manager.broadcast(str(id), {
        "event": "medicine_updated",
        "medicine_id": str(med.id),
        "medicine_name": med.medicine_name,
        "quantity_available": med.quantity_available
    })

    return {
        "status": "success",
        "medicine": {
            "id": str(med.id),
            "quantity_available": med.quantity_available
        }
    }

from app.services.routing_service import find_best_facilities
from app.schemas.routing import RoutingRequest
from app.schemas.triage import UrgencyLevel

@router.post("/route")
async def compute_smart_routing(req: RouteRequest, db: AsyncSession = Depends(get_db)):
    urgency_enum = UrgencyLevel.ROUTINE
    if req.urgency_level.upper() == "EMERGENCY":
        urgency_enum = UrgencyLevel.EMERGENCY
    elif req.urgency_level.upper() == "URGENT":
        urgency_enum = UrgencyLevel.URGENT

    routing_req = RoutingRequest(
        latitude=req.latitude,
        longitude=req.longitude,
        urgency_level=urgency_enum,
        recommended_specialty=req.recommended_specialty or "General Medicine",
        radius_km=100.0
    )

    ranked_facilities = await find_best_facilities(db, routing_req)
    return ranked_facilities
