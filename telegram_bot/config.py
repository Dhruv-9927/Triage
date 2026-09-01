from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://sehat_user:sehat_dev_password@localhost:5432/sehat_db"
    DATABASE_URL_SYNC: str = "postgresql://sehat_user:sehat_dev_password@localhost:5432/sehat_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"
    BHASHINI_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    GOOGLE_TRANSLATE_API_KEY: str = ""
    TRANSLATION_PROVIDER: str = "mock"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
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
