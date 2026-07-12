from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    asset_tag = Column(String(30), unique=True, nullable=False)

    name = Column(String(150), nullable=False)

    serial_number = Column(String(100), nullable=True)

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    holder_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    location = Column(String(100))

    acquisition_cost = Column(Float, default=0)

    condition = Column(String(30), default="Good")

    status = Column(
        String(30),
        default="Available"
    )

    is_bookable = Column(Boolean, default=False)

    category = relationship("Category", back_populates="assets")

    department = relationship("Department")

    holder = relationship("User")