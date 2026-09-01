import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Date, Text, DateTime, func, ForeignKey
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    dob: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(20))
    blood_group: Mapped[Optional[str]] = mapped_column(String(5))
    abha_id: Mapped[Optional[str]] = mapped_column(String(50))
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20))
    medical_history: Mapped[Optional[str]] = mapped_column(Text)
    allergies: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")
    triage_sessions = relationship("TriageSession", back_populates="patient")
