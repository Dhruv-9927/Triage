import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Bed(Base):
    __tablename__ = "beds"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("facilities.id"))
    ward_name: Mapped[str] = mapped_column(String(100))
    bed_number: Mapped[str] = mapped_column(String(20))
    bed_type: Mapped[str] = mapped_column(String(30), default="GENERAL")
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE")
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('facility_id', 'ward_name', 'bed_number', name='_facility_ward_bed_uc'),)

    facility = relationship("Facility", back_populates="beds")
