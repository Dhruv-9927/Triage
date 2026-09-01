from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.doctors import router as doctors_router
from app.api.v1.facilities import router as facilities_router
from app.api.v1.triage import router as triage_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.queue import router as queue_router
from app.api.v1.sync import router as sync_router
from app.api.v1.translate import router as translate_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(patients_router, prefix="/patients", tags=["patients"])
api_router.include_router(doctors_router, prefix="/doctors", tags=["doctors"])
api_router.include_router(facilities_router, prefix="/facilities", tags=["facilities"])
api_router.include_router(triage_router, prefix="/triage", tags=["triage"])
api_router.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
api_router.include_router(queue_router, prefix="/queue", tags=["queue"])
api_router.include_router(sync_router, prefix="/sync", tags=["sync"])
api_router.include_router(translate_router, prefix="/translate", tags=["translate"])
