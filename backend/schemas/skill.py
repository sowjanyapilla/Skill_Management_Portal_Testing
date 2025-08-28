from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date
from models.skill import SkillStatus


# -------------------- SubSkill --------------------
class SubSkillBase(BaseModel):
    subskill_name: str
    employee_proficiency: int
    experience_years: float
    certification: Optional[str] = None
    certification_creation_date: Optional[date] = None
    certification_expiration_date: Optional[date] = None


class SubSkillCreate(SubSkillBase):
    pass


class SubSkillResponse(BaseModel):
    id: int
    emp_skill_id: int
    employee_id: int
    subskill_id: int
    subskill_name: str
    employee_proficiency: int
    manager_proficiency: Optional[int] = None
    experience_years: float
    certification: Optional[str]
    certification_file_url: Optional[str] = None
    certification_creation_date: Optional[date] = None
    certification_expiration_date: Optional[date] = None
    status: Optional[str]
    manager_comments: Optional[str]
    approver_id: Optional[int]
    created_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------- Skill --------------------
class SkillBase(BaseModel):
    skill_name: str


class SkillCreate(SkillBase):
    sub_skills: List[SubSkillCreate]


class SkillResponse(SkillBase):
    id: int
    user_id: int
    status: SkillStatus
    manager_comments: Optional[str] = None
    created_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None
    sub_skills: List[SubSkillResponse] = []

    class Config:
        from_attributes = True


# -------------------- History --------------------
class SkillHistoryResponse(BaseModel):
    history_id: int
    emp_skill_id: int
    employee_id: int
    subskill_id: int
    experience_years: float
    employee_proficiency: int
    manager_proficiency: Optional[int] = None
    certification: Optional[str] = None
    manager_comments: Optional[str] = None
    approval_status: SkillStatus
    approver_id: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------- Filters & Approvals --------------------
class SkillFilter(BaseModel):
    skill: Optional[str] = None
    proficiency: Optional[int] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    has_certification: Optional[bool] = None


class SkillApprovalRequest(BaseModel):
    action: str  # "approve" or "reject"
    manager_comments: Optional[str] = None
    proficiency_modifications: Optional[Dict[int, int]] = None
