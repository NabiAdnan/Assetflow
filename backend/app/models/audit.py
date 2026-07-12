from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database.database import Base


class Audit(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    action = Column(String(50))

    entity = Column(String(50))

    description = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)