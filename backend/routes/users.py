from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserProfile
from routes.auth import get_current_user# async dependency

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(User.__table__.select().offset(skip).limit(limit))
    users = result.fetchall()
    return [UserResponse.from_orm(user[0]) for user in users]


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfile.from_orm(current_user)


@router.get("/subordinates", response_model=List[UserResponse])
async def get_subordinates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_manager:
        raise HTTPException(status_code=403, detail="Only managers can view subordinates")

    result = await db.execute(User.__table__.select().where(User.manager_id == current_user.id))
    subordinates = result.fetchall()
    return [UserResponse.from_orm(user[0]) for user in subordinates]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(User.__table__.select().where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.from_orm(user)
