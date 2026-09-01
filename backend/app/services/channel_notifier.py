import logging
import json
from app.services.event_bus import (
    event_bus, 
    APPOINTMENT_CREATED, 
    QUEUE_ADVANCED, 
    TOKEN_CREATED, 
    TRIAGE_COMPLETED
)
from app.services.notification_service import send_telegram_notification
from app.websockets.manager import manager
try:
    from app.bot.i18n import get_text
except ImportError:
    def get_text(key, lang="en"):
        return key

logger = logging.getLogger(__name__)

async def on_appointment_created(payload: dict) -> None:
    facility_id = payload.get("facility_id")
    if facility_id:
        await manager.broadcast_to_facility(json.dumps({"event": "appointment_created", "payload": payload}), str(facility_id))
    
    chat_id = payload.get("telegram_chat_id")
    if chat_id:
        lang = payload.get("preferred_language", "en")
        msg = get_text("appointment_created_msg", lang)
        await send_telegram_notification(chat_id, msg)

async def on_queue_advanced(payload: dict) -> None:
    facility_id = payload.get("facility_id")
    if facility_id:
        await manager.broadcast_to_facility(json.dumps({"event": "queue_advanced", "payload": payload}), str(facility_id))
        
    chat_id = payload.get("telegram_chat_id")
    if chat_id:
        lang = payload.get("preferred_language", "en")
        pos = payload.get("position")
        msg = f"{get_text('queue_position_update', lang)} {pos}"
        await send_telegram_notification(chat_id, msg)

async def on_token_created(payload: dict) -> None:
    facility_id = payload.get("facility_id")
    if facility_id:
        await manager.broadcast_to_facility(json.dumps({"event": "token_created", "payload": payload}), str(facility_id))

async def on_triage_completed(payload: dict) -> None:
    facility_id = payload.get("facility_id")
    if facility_id:
        await manager.broadcast_to_facility(json.dumps({"event": "triage_completed", "payload": payload}), str(facility_id))

def register_all_listeners() -> None:
    event_bus.subscribe(APPOINTMENT_CREATED, on_appointment_created)
    event_bus.subscribe(QUEUE_ADVANCED, on_queue_advanced)
    event_bus.subscribe(TOKEN_CREATED, on_token_created)
    event_bus.subscribe(TRIAGE_COMPLETED, on_triage_completed)
