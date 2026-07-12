from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.database.database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)

    asset_id = Column(Integer, ForeignKey("assets.id"))

    from_employee = Column(Integer, ForeignKey("users.id"))

    to_employee = Column(Integer, ForeignKey("users.id"))

    request_date = Column(Date)

    status = Column(String, default="Pending")

    asset = relationship("Asset")