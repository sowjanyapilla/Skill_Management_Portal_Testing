

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class SkillStatus(enum.Enum):
    # PENDING = "PENDING"
    # APPROVED = "APPROVED"
    # REJECTED = "REJECTED"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sub_skills = relationship("SubSkill", back_populates="skill", cascade="all, delete-orphan")



class SubSkill(Base):
    __tablename__ = "sub_skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sub_skill_name = Column(String, nullable=False)

    # Employee’s self-assessed values
    employee_proficiency = Column(Integer, nullable=False)  # 1–5
    experience_years = Column(Float, nullable=False)
    has_certification = Column(Boolean, default=False)
    certification_file_url = Column(String)

    # Manager-reviewed values
    manager_proficiency = Column(Integer, nullable=True)
    status = Column(Enum(SkillStatus), default=SkillStatus.PENDING)
    manager_comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    skill = relationship("Skill", back_populates="sub_skills")
    user = relationship("User", back_populates="skills")

