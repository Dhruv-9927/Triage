"""
SeHAT Event Bus — Cross-channel notification system.

Allows services to publish events when data changes, and channel-specific
listeners (WebSocket for website, Telegram bot for chat users) to react
independently without coupling to each other.
"""
import asyncio
import logging
from typing import Any, Callable, Coroutine, Dict, List

logger = logging.getLogger(__name__)

# --- Event Types ---
APPOINTMENT_CREATED = "appointment.created"
APPOINTMENT_CANCELLED = "appointment.cancelled"
APPOINTMENT_UPDATED = "appointment.updated"
QUEUE_ADVANCED = "queue.advanced"
QUEUE_CHECKED_IN = "queue.checked_in"
TRIAGE_COMPLETED = "triage.completed"
BED_STATUS_CHANGED = "bed.status_changed"
TOKEN_CREATED = "token.created"
PATIENT_REGISTERED = "patient.registered"

# Type alias for event handlers
EventHandler = Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]


class EventBus:
    """
    In-process async event bus for cross-channel notifications.

    Usage:
        # Subscribe
        event_bus.subscribe("appointment.created", my_handler)

        # Publish (fire-and-forget, errors in listeners don't propagate)
        await event_bus.publish("appointment.created", {
            "appointment_id": "...",
            "patient_id": "...",
            "facility_id": "...",
        })
    """

    def __init__(self):
        self._listeners: Dict[str, List[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Register a handler for an event type."""
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(handler)
        logger.info(f"EventBus: subscribed {handler.__name__} to '{event_type}'")

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """Remove a handler for an event type."""
        if event_type in self._listeners:
            self._listeners[event_type] = [
                h for h in self._listeners[event_type] if h != handler
            ]

    async def publish(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Publish an event to all registered listeners.

        Handlers run as background tasks (fire-and-forget).
        Errors in one listener don't affect others or the caller.
        """
        handlers = self._listeners.get(event_type, [])
        if not handlers:
            return

        logger.info(f"EventBus: publishing '{event_type}' to {len(handlers)} listener(s)")

        for handler in handlers:
            try:
                # Run each handler as a background task
                asyncio.create_task(self._safe_call(handler, event_type, payload))
            except Exception as e:
                logger.error(f"EventBus: failed to schedule handler {handler.__name__}: {e}")

    async def _safe_call(
        self, handler: EventHandler, event_type: str, payload: Dict[str, Any]
    ) -> None:
        """Safely call a handler, catching and logging any errors."""
        try:
            await handler(payload)
        except Exception as e:
            logger.error(
                f"EventBus: error in handler {handler.__name__} for '{event_type}': {e}",
                exc_info=True,
            )


# Global singleton — imported by services and channel notifiers
event_bus = EventBus()
