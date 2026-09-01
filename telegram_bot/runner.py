"""
Standalone Telegram Bot Polling Runner for local testing.

Usage:
    python -m app.bot.runner
"""
import sys
import os
from pathlib import Path

# Ensure backend directory is on sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import asyncio
import logging
from app.config import settings
from app.database import init_db
from app.bot.bot import bot, dp
from app.services.channel_notifier import register_all_listeners


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def main():
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is not set in .env! Please add your token from @BotFather.")
        return

    logger.info("Initializing database and event listeners...")
    await init_db()
    register_all_listeners()

    while True:
        try:
            # Drop any active webhook before starting long polling
            await bot.delete_webhook(drop_pending_updates=True)
            bot_info = await bot.get_me()
            logger.info(f"Bot connected: @{bot_info.username} ({bot_info.full_name})")
            print(f"[ONLINE] Telegram Bot is LIVE: @{bot_info.username}")
            print("Send /start on Telegram to test triage, booking, and queue!")

            await dp.start_polling(bot, handle_signals=False)
            break
        except Exception as e:
            logger.warning(f"Connection retry: {e}")
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
