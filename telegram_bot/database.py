import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Primary database URL from settings
db_url = settings.DATABASE_URL

try:
    engine = create_async_engine(db_url, echo=False)
except Exception:
    db_url = "sqlite+aiosqlite:///./sehat.db"
    engine = create_async_engine(db_url, echo=False)

async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_db():
    """Initializes the database schema with automatic SQLite fallback if PostgreSQL is offline."""
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database schema initialized successfully with {engine.url.drivername}")
    except Exception as e:
        logger.warning(f"Failed to connect to primary database ({e}). Falling back to local SQLite database.")
        sqlite_url = "sqlite+aiosqlite:///./sehat.db"
        engine = create_async_engine(sqlite_url, echo=False)
        async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local SQLite database initialized successfully at ./sehat.db")
