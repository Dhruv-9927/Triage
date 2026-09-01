import logging
import ssl
from contextlib import asynccontextmanager
from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.fsm.storage.memory import MemoryStorage
from app.config import settings
from app.database import async_session

logger = logging.getLogger(__name__)

# Set up storage — use Redis for persistent FSM state if available
try:
    from aiogram.fsm.storage.redis import RedisStorage
    if settings.REDIS_URL:
        storage = RedisStorage.from_url(settings.REDIS_URL)
        logger.info("Using Redis FSM storage")
    else:
        storage = MemoryStorage()
        logger.info("Using in-memory FSM storage")
except ImportError:
    storage = MemoryStorage()
    logger.info("Redis storage not available, using in-memory FSM storage")

# Handle token with robust session configuration for Windows
if settings.TELEGRAM_BOT_TOKEN:
    ssl_context = ssl.create_default_context()
    session = AiohttpSession(timeout=30.0)
    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN, session=session)
else:
    bot = None
    logger.warning("TELEGRAM_BOT_TOKEN is not set. Bot will not be initialized.")

dp = Dispatcher(storage=storage)


@asynccontextmanager
async def get_db_session():
    """Async context manager for bot handlers to access the database."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# --- Register all handler routers ---
from app.bot.handlers.start import router as start_router
from app.bot.handlers.language import router as language_router
from app.bot.handlers.registration import router as registration_router
from app.bot.handlers.triage import router as triage_router
from app.bot.handlers.appointments import router as appointments_router
from app.bot.handlers.queue import router as queue_router

dp.include_router(start_router)
dp.include_router(language_router)
dp.include_router(registration_router)
dp.include_router(triage_router)
dp.include_router(appointments_router)
dp.include_router(queue_router)

logger.info("All bot handler routers registered with dispatcher")
