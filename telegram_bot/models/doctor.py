import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, func, ForeignKey
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    facility_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("facilities.id"))
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    specialization: Mapped[str] = mapped_column(String(100))
    license_number: Mapped[str] = mapped_column(String(50), unique=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    consultation_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    languages: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="doctor_profile")
    facility = relationship("Facility", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
