"""
SeHAT — Smart e-Health Access & Triage
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.router import api_router
from app.websockets.manager import manager
from app.services.channel_notifier import register_all_listeners


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize DB, auto-seed if empty, set up Telegram bot."""
    await init_db()
    register_all_listeners()

    # Auto-seed database if empty (ensures demo accounts work on fresh cloud deployments)
    try:
        from app.database import async_session
        from app.models.user import User
        from sqlalchemy.future import select
        async with async_session() as session:
            res = await session.execute(select(User).limit(1))
            if not res.scalars().first():
                print("[SEED] Fresh database detected. Auto-seeding demo users and clinics...")
                from app.seed.seed_data import seed
                await seed()
                print("[SEED] Auto-seeding completed successfully!")
    except Exception as e:
        print(f"[SEED WARNING] Auto-seed failed or skipped: {e}")

    # Initialize Telegram bot if token is configured
    bot_task = None
    if settings.TELEGRAM_BOT_TOKEN:
        try:
            import asyncio
            from app.bot.bot import bot, dp
            if settings.TELEGRAM_WEBHOOK_URL:
                await bot.set_webhook(
                    url=f"{settings.TELEGRAM_WEBHOOK_URL}/webhook/telegram",
                    allowed_updates=dp.resolve_used_update_types(),
                )
                print(f"Telegram webhook set: {settings.TELEGRAM_WEBHOOK_URL}/webhook/telegram")
            else:
                # Start non-blocking polling inside FastAPI process
                await bot.delete_webhook(drop_pending_updates=True)
                bot_info = await bot.get_me()
                print(f"[ONLINE] Telegram Bot polling started: @{bot_info.username}")
                bot_task = asyncio.create_task(dp.start_polling(bot, handle_signals=False))
        except Exception as e:
            print(f"Warning: Failed to initialize Telegram bot: {e}")

    yield

    # Cleanup: cancel polling / delete webhook and close bot session
    if settings.TELEGRAM_BOT_TOKEN:
        try:
            from app.bot.bot import bot
            if bot_task:
                bot_task.cancel()
            await bot.delete_webhook()
            await bot.session.close()
        except Exception:
            pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Smart e-Health Access & Triage — AI-powered healthcare routing for rural India",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware supporting localhost, Vercel deployments (*.vercel.app), and all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")


# --- WebSocket Endpoint ---
@app.websocket("/ws/facilities/{facility_id}/live")
async def websocket_endpoint(websocket: WebSocket, facility_id: str):
    """WebSocket for real-time facility availability updates."""
    await manager.connect(websocket, facility_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, facility_id)


# --- Telegram Webhook ---
@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """Receive Telegram bot updates via webhook."""
    if not settings.TELEGRAM_BOT_TOKEN:
        return {"status": "bot not configured"}

    try:
        from aiogram.types import Update
        from app.bot.bot import bot, dp

        update_data = await request.json()
        update = Update.model_validate(update_data, context={"bot": bot})
        await dp.feed_update(bot, update)
        return {"status": "ok"}
    except Exception as e:
        print(f"Telegram webhook error: {e}")
        return {"status": "error", "detail": str(e)}


# --- Root Endpoint ---
@app.get("/")
async def root():
    """API root — health check and info."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "description": "Smart e-Health Access & Triage API",
        "docs": "/docs",
        "endpoints": {
            "api": "/api/v1",
            "websocket": "/ws/facilities/{facility_id}/live",
            "telegram_webhook": "/webhook/telegram",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}
