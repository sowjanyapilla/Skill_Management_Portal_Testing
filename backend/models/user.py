from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    employee_id = Column(String, unique=True, nullable=False, index=True)
    is_manager = Column(Boolean, default=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    designation = Column(String(100), nullable=True)
    capability = Column(String(100), nullable=True)

    # Relationships
    manager = relationship("User", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("User", back_populates="manager", cascade="all, delete-orphan")
    skills = relationship("SubSkill", back_populates="user", cascade="all, delete-orphan")