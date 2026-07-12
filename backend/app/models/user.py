from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False, index=True)

    hashed_password = Column(String, nullable=False)

    role = Column(String(30), default="Employee")

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    is_active = Column(Boolean, default=True)

    department = relationship(
        "Department",
        back_populates="users"
    )