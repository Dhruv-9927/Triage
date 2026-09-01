import httpx
import logging
import json
from app.config import settings

logger = logging.getLogger(__name__)

async def send_telegram_notification(chat_id: int, message: str):
    if not settings.TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send telegram notification: {e}")

async def send_telegram_notification_with_keyboard(chat_id: int, message: str, keyboard_json: str):
    if not settings.TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    
    try:
        reply_markup = json.loads(keyboard_json) if isinstance(keyboard_json, str) else keyboard_json
    except Exception:
        reply_markup = keyboard_json

    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
        "reply_markup": reply_markup
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send telegram notification with keyboard: {e}")
