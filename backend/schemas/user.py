from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# -------------------- Base --------------------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    employee_id: str
    manager_id: Optional[int] = None


# -------------------- Create --------------------
class UserCreate(UserBase):
    pass


# -------------------- Login --------------------
class UserLogin(BaseModel):
    google_token: str


# -------------------- Response --------------------
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------- Profile with Relations --------------------
class UserProfile(UserResponse):
    subordinates: List["UserResponse"] = Field(default_factory=list)
    manager: Optional["UserResponse"] = None

    class Config:
        from_attributes = True

class UserAuthenticated(BaseModel):
    id: int
    email: EmailStr
    name: str
    employee_id: str
    is_manager: bool # This field was missing
    manager_id: Optional[int] = None
    created_at: datetime
    designation: Optional[str] = None # This field was missing
    capability: Optional[str] = None # This field was missing

    model_config = {
        "from_attributes": True
    }