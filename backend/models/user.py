# from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     email = Column(String, unique=True, index=True, nullable=False)
#     name = Column(String, nullable=False)
#     employee_id = Column(String, unique=True, nullable=False, index=True)
#     is_manager = Column(Boolean, default=False)
#     manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     designation = Column(String(100), nullable=True)
#     capability = Column(String(100), nullable=True)

#     # Relationships
#     manager = relationship("User", remote_side=[id], back_populates="subordinates")
#     subordinates = relationship("User", back_populates="manager", cascade="all, delete-orphan")
#     skills = relationship("SubSkill", back_populates="user", cascade="all, delete-orphan")



from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)  # PK
    emp_id = Column(String(50), unique=True, nullable=False, index=True)  # Business emp id
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)

    approver_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    is_approver = Column(Boolean, default=False)
    designation = Column(String(100), nullable=True)
    capability = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)

    # Relationships
    approver = relationship("Employee", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("Employee", back_populates="approver", cascade="all, delete-orphan")

    # skills & history relationships (based on your schema)
    skills = relationship("EmployeeSkill", back_populates="employee",
                          cascade="all, delete-orphan",
                          foreign_keys="EmployeeSkill.employee_id")

    skill_histories = relationship("EmployeeSkillHistory", back_populates="employee",
                                   cascade="all, delete-orphan",
                                   foreign_keys="EmployeeSkillHistory.employee_id")
    resumes = relationship("EmployeeResume", back_populates="employee", cascade="all, delete-orphan")
    


class EmployeeResume(Base):
    __tablename__ = "employee_resumes"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    resume_url = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(100))

    # Optional: Relation to Employee
    employee = relationship("Employee", back_populates="resumes")