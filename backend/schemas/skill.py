from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from models.skill import SkillStatus


# -------------------- SubSkill --------------------
class SubSkillBase(BaseModel):
    subskill_name: str
    employee_proficiency: int
    experience_years: float = Field(..., alias="experience")
    certification: Optional[str] = None
    certification_creation_date: Optional[date] = None
    certification_expiration_date: Optional[date] = None
    approver_id: Optional[int] = None 

    class Config:
        allow_population_by_field_name = True


class SubSkillCreate(SubSkillBase):
    pass

    class Config:
        allow_population_by_field_name = True


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
        use_enum_values = True 


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


class EmployeeSkillUpdateRequest(BaseModel):
    emp_skill_id: Optional[int] = None  # For pending/approved
    history_id: Optional[int] = None    # For rejected
    employee_id: int
    subskill_id: int
    experience_years: int
    proficiency_level: int
    certification: Optional[str] = None
    certification_creation_date: Optional[date] = None
    certification_expiration_date: Optional[date] = None
    emp_skill_id: Optional[int] = None
    history_id: Optional[int] = None

class EmployeeSkillResponse(BaseModel):
    employee_id: int
    subskill_id: int
    skill_name: str
    subskill_name: str
    experience: Optional[int] = None
    proficiency: Optional[int] = None
    certification: Optional[str] = None
    certification_creation_date: Optional[str] = None
    certification_expiration_date: Optional[str] = None
    status: str

    class Config:
        orm_mode = True


class SubSkillSchema(BaseModel):
    subskill_id: int
    skill_id: int
    subskill_name: str

    class Config:
        orm_mode = True

class MasterSkillSchema(BaseModel):
    skill_id: int
    skill_name: str
    subskills: List[SubSkillSchema] = []

    class Config:
        orm_mode = True

class PaginatedMasterSkills(BaseModel):
    total: int
    page: int
    page_size: int
    master_skills: List[MasterSkillSchema]

class SubSkillCreate(BaseModel):
    subskill_name: str

class MasterSkillCreate(BaseModel):
    skill_name: str
    sub_skills: List[SubSkillCreate]

class SubSkillUpdate(BaseModel):
    subskill_name: Optional[str] = None
    proficiency_level: Optional[int] = None

class SkillUpdate(BaseModel):
    skill_name: Optional[str] = None
    sub_skills: Optional[List[SubSkillUpdate]] = None  # <-- Make optional

class MasterSkillSubSkillCreate(BaseModel):
    skill_id: int
    subskill_name: str


# ---------- Pydantic request model ----------
class SubskillRequirement(BaseModel):
    subskill_id: int
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    min_proficiency: Optional[int] = None
    require_certification: Optional[bool] = None


class MatchingRequest(BaseModel):
    requirements: Optional[List[SubskillRequirement]] = []

class ExportRequest(BaseModel):
    requirements: Optional[List[SubskillRequirement]] = []