from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_db
from models.user import Employee
from schemas.user import EmployeeResponse, EmployeeProfile
from routes.auth import get_current_user  # async dependency

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[EmployeeResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(Employee).offset(skip).limit(limit))
    users = result.scalars().all()
    return [EmployeeResponse.model_validate(user) for user in users]


@router.get("/profile", response_model=EmployeeProfile)
async def get_user_profile(current_user: Employee = Depends(get_current_user)):
    return EmployeeProfile.model_validate(current_user)


@router.get("/subordinates", response_model=List[EmployeeResponse])
async def get_subordinates(
    current_user: Employee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_approver:  # ✅ renamed field
        raise HTTPException(status_code=403, detail="Only approvers can view subordinates")

    result = await db.execute(
        select(Employee).where(Employee.approver_id == current_user.id)
    )
    subordinates = result.scalars().all()
    return [EmployeeResponse.model_validate(user) for user in subordinates]


@router.get("/{user_id}", response_model=EmployeeResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return EmployeeResponse.model_validate(user)
