import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, BigInteger, Boolean, Text, DateTime, func, ForeignKey
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TriageSession(Base):
    __tablename__ = "triage_sessions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"))
    channel: Mapped[str] = mapped_column(String(30), default="WEB")
    telegram_chat_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    language: Mapped[str] = mapped_column(String(10), default="en")
    raw_symptoms: Mapped[str] = mapped_column(Text)
    urgency_level: Mapped[str] = mapped_column(String(20), default="ROUTINE")
    red_flags_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_response: Mapped[Optional[str]] = mapped_column(Text)
    recommended_specialty: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="triage_sessions")
