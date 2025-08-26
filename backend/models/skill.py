

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


import enum
from sqlalchemy import Enum

class SkillStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class MasterSkill(Base):
    __tablename__ = "master_skills"

    skill_id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), unique=True, nullable=False)

    # Relationships
    subskills = relationship("SubSkill", back_populates="master_skill", cascade="all, delete-orphan")



class SubSkill(Base):
    __tablename__ = "sub_skills"

    subskill_id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("master_skills.skill_id", ondelete="CASCADE"), nullable=False)
    subskill_name = Column(String(100), nullable=False)

    # Relationships
    master_skill = relationship("MasterSkill", back_populates="subskills")
    employee_skills = relationship("EmployeeSkill", back_populates="subskill", cascade="all, delete-orphan")
    skill_histories = relationship("EmployeeSkillHistory", back_populates="subskill", cascade="all, delete-orphan")



class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    emp_skill_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)  # ✅ FK to PK
    subskill_id = Column(Integer, ForeignKey("sub_skills.subskill_id", ondelete="CASCADE"), nullable=False)
    experience = Column(Integer)
    proficiency = Column(Integer)
    certification = Column(String(200))
    manager_comments = Column(Text)
    status = Column(
        Enum(SkillStatus, name="skill_status", create_type=False),
        default=SkillStatus.PENDING,
        nullable=False
    )
    approver_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="skills", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approver_id])
    subskill = relationship("SubSkill", back_populates="employee_skills")
    histories = relationship("EmployeeSkillHistory", back_populates="skill", cascade="all, delete-orphan")
    created_date = Column(DateTime(timezone=True), server_default=func.now())


class EmployeeSkillHistory(Base):
    __tablename__ = "employee_skill_history"

    history_id = Column(Integer, primary_key=True, index=True)
    emp_skill_id = Column(Integer, ForeignKey("employee_skills.emp_skill_id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    subskill_id = Column(Integer, ForeignKey("sub_skills.subskill_id", ondelete="CASCADE"), nullable=False)

    experience = Column(Integer)
    proficiency = Column(Integer)
    certification = Column(String(200))
    manager_proficiency = Column(Integer)
    manager_comments = Column(Text)
    approval_status = Column(
        Enum(SkillStatus, name="skill_status", create_type=False),
        default=SkillStatus.PENDING,
        nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    approver_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    skill = relationship("EmployeeSkill", back_populates="histories")
    employee = relationship("Employee", back_populates="skill_histories", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approver_id])
    updated_by_user = relationship("Employee", foreign_keys=[updated_by])
    subskill = relationship("SubSkill", back_populates="skill_histories")


