from sqlalchemy import Column, Integer, Date, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(
        Integer,
        ForeignKey("assets.id"),
        nullable=False
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    allocated_date = Column(Date)

    expected_return = Column(Date)

    returned_date = Column(Date, nullable=True)

    remarks = Column(Text, nullable=True)

    asset = relationship("Asset")

    employee = relationship("User")