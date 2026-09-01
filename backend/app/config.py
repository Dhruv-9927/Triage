from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "sehat.db"

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DB_FILE.as_posix()}"
    DATABASE_URL_SYNC: str = f"sqlite:///{DB_FILE.as_posix()}"

    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "sehat-hackathon-super-secret-key-32-chars-minimum-demo"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_PROVIDER: str = "groq"
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    BHASHINI_USER_ID: str = "47f0e18310-635c-47c8-bfc3-7ee49b54e4ce"
    BHASHINI_API_KEY: str = "Ha1Pyj-DXVGJwcn_DsFcsm_RvscXpULG0iHO_idpm3hHBkS_OD06QUnADMkWd6yl"
    BHASHINI_INFERENCE_URL: str = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    GOOGLE_TRANSLATE_API_KEY: str = ""
    TRANSLATION_PROVIDER: str = "bhashini"
    BHASHINI_INFERENCE_KEY: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    APP_NAME: str = "Triage+"
    DEBUG: bool = True

    # n8n workflow orchestration
    N8N_WEBHOOK_BASE_URL: str = "http://localhost:5678/webhook"

    # Exotel / Indian Telephony
    EXOTEL_PHONE_NUMBER: str = "+914448133795"
    EXOTEL_LANDLINE: str = "044-48133795"
    TWILIO_PHONE_NUMBER: str = "+914448133795"
    TOLL_FREE_HELPLINE: str = "+91 44 4813 3795"

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

settings = Settings()

