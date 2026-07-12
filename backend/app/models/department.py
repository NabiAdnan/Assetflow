from sqlalchemy import Column, Integer, String
from app.database.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    parent_department = Column(String, nullable=True)

    head = Column(String, nullable=True)

    status = Column(String, default="Active")