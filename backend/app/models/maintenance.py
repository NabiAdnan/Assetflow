from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.database.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(
        Integer,
        ForeignKey("assets.id"),
        nullable=False
    )

    reported_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    issue = Column(String(255))

    technician = Column(String(100), nullable=True)

    status = Column(
        String(30),
        default="Pending"
    )

    reported_date = Column(Date)

    completed_date = Column(Date, nullable=True)

    asset = relationship("Asset")