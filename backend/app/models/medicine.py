import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Date, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class MedicineInventory(Base):
    __tablename__ = "medicine_inventory"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("facilities.id"))
    medicine_name: Mapped[str] = mapped_column(String(255))
    generic_name: Mapped[Optional[str]] = mapped_column(String(255))
    category: Mapped[Optional[str]] = mapped_column(String(100))
    batch_number: Mapped[str] = mapped_column(String(100))
    quantity_available: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=20)
    expiry_date: Mapped[date] = mapped_column(Date)
    is_essential: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('facility_id', 'medicine_name', 'batch_number', name='_facility_medicine_batch_uc'),)

    facility = relationship("Facility", back_populates="medicine_inventory")
