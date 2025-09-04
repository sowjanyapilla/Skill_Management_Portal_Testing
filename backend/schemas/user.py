from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# -------------------- Base --------------------
class EmployeeBase(BaseModel):
    email: EmailStr
    name: str
    emp_id: str                           # Matches DB column
    approver_id: Optional[int] = None   
      # Matches DB column


# -------------------- Create --------------------
class EmployeeCreate(EmployeeBase):
    is_approver: Optional[bool]
    is_active: Optional[bool] = True
    is_available:Optional[bool]
    designation: Optional[str] = None
    capability: Optional[str] = None
    pass


# -------------------- Login --------------------
class EmployeeLogin(BaseModel):
    google_token: str


# -------------------- Response --------------------
class EmployeeResponse(EmployeeBase):
    id: int
    designation: Optional[str] = None
    capability: Optional[str] = None
    is_approver: bool
    is_active: bool
    is_available: bool

    class Config:
        from_attributes = True


class EmployeeMinimalResponse(EmployeeBase):
    id: int
    pass 

    class Config:
        from_attributes = True


# -------------------- Profile with Relations --------------------
class EmployeeProfile(EmployeeResponse):
    subordinates: List["EmployeeResponse"] = Field(default_factory=list)
    approver: Optional["EmployeeResponse"] = None   # approver_id relationship

    class Config:
        from_attributes = True


# -------------------- Authenticated User --------------------
class EmployeeAuthenticated(BaseModel):
    id: int
    email: EmailStr
    name: str
    emp_id: str
    is_approver: bool                 # Matches DB column
    approver_id: Optional[int] = None
    designation: Optional[str] = None
    capability: Optional[str] = None
    is_active: bool
    is_available: bool

    model_config = {
        "from_attributes": True
    }

class EmployeeUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    approver_id: Optional[int] = None
    designation: Optional[str] = None
    capability: Optional[str] = None
    is_approver: Optional[bool] = None
    is_active: Optional[bool] = None
    is_available: Optional[bool] = None
