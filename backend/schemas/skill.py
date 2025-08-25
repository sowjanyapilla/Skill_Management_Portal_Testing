from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from models.skill import SkillStatus


# -------------------- SubSkill --------------------
class SubSkillBase(BaseModel):
    sub_skill_name: str
    employee_proficiency: int  # self-assessed
    experience_years: float
    has_certification: bool = False
    certification_file_url: Optional[str] = None


class SubSkillCreate(SubSkillBase):
    pass


class SubSkillResponse(SubSkillBase):
    id: int
    skill_id: int
    manager_proficiency: Optional[int] = None  # manager's override
    status: SkillStatus                        # approval at sub-skill level
    manager_comments: Optional[str] = None
    created_at: datetime
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
    status: SkillStatus                        # overall skill approval status
    manager_comments: Optional[str] = None
    created_at: datetime
    last_updated_at: Optional[datetime] = None
    sub_skills: List[SubSkillResponse] = []

    model_config = {
        "from_attributes": True
    }


# -------------------- Filters & Approvals --------------------
class SkillFilter(BaseModel):
    skill: Optional[str] = None
    proficiency: Optional[int] = None
    experience: Optional[float] = None
    has_certification: Optional[bool] = None


class SkillApprovalRequest(BaseModel):
    action: str  # "approve" or "reject"
    manager_comments: Optional[str] = None
    proficiency_modifications: Optional[Dict[int, int]] = None  # {sub_skill_id: new_manager_proficiency}
