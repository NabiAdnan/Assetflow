from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    resource_id = Column(
        Integer,
        ForeignKey("assets.id"),
        nullable=False
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    start_time = Column(DateTime, nullable=False)

    end_time = Column(DateTime, nullable=False)

    purpose = Column(String(255))

    status = Column(String(30), default="Upcoming")

    resource = relationship("Asset")

    employee = relationship("User")