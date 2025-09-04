from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List

from database import get_db
from models.user import Employee
from schemas.user import EmployeeResponse, EmployeeProfile, EmployeeUpdate, EmployeeCreate, EmployeeMinimalResponse
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

@router.get("/list", response_model=List[EmployeeResponse])
async def list_users(
    search: str = Query("", description="Search by name or emp_id"),
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    stmt = select(Employee).offset(offset).limit(page_size)
    
    if search:
        stmt = select(Employee).where(
            or_(
                Employee.name.ilike(f"%{search}%"),
                Employee.emp_id.ilike(f"%{search}%")
            )
        ).offset(offset).limit(page_size)
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [EmployeeResponse.model_validate(user) for user in users]

@router.get("/approvers", response_model=List[EmployeeMinimalResponse])
async def list_approvers(
    db: AsyncSession = Depends(get_db),
    search_term: str = Query("", description="Search for employees by name or ID"),
):
    """
    Returns a minimal list of all employees for approver selection,
    without pagination, and with an optional search filter.
    """
    query = select(Employee)
    if search_term:
        query = query.where(
            or_(
                Employee.name.ilike(f"%{search_term}%"),
                Employee.emp_id.ilike(f"%{search_term}%")
            )
        )
    
    result = await db.execute(query)
    employees = result.scalars().all()
    
    return [EmployeeMinimalResponse.model_validate(emp) for emp in employees]


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


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    employee: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Pass all fields including optional ones
    new_user = Employee(
        emp_id=employee.emp_id,
        name=employee.name,
        email=employee.email,
        approver_id=employee.approver_id,
        is_approver=employee.is_approver,
        designation=employee.designation,
        capability=employee.capability,
        is_active=employee.is_active,
        is_available=employee.is_available
    )
    db.add(new_user)
    
    # If an approver is specified, fetch and update their status
    if employee.approver_id:
        approver_to_update = await db.get(Employee, employee.approver_id)
        if approver_to_update and not approver_to_update.is_approver:
            approver_to_update.is_approver = True
            # The session will track this change, and it will be committed below

    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Employee with this email or emp_id already exists")
    
    return EmployeeResponse.model_validate(new_user)

# -------------------- Update Employee --------------------
@router.put("/{user_id}", response_model=EmployeeResponse)
async def update_user(
    user_id: int,
    employee: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == user_id))
    user_obj = result.scalar_one_or_none()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")

    # Update all possible fields from EmployeeUpdate
    for key, value in employee.dict(exclude_unset=True).items():
        setattr(user_obj, key, value)

    db.add(user_obj)
    await db.commit()
    await db.refresh(user_obj)
    return EmployeeResponse.model_validate(user_obj)


# -------------------- Delete Employee --------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == user_id))
    user_obj = result.scalar_one_or_none()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user_obj)
    await db.commit()
    return

# -------------------- Toggle Active Status --------------------
@router.patch("/{user_id}/toggle-active-status", response_model=EmployeeResponse)
async def toggle_active_status(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    result = await db.execute(select(Employee).where(Employee.id == user_id))
    user_obj = result.scalar_one_or_none()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")

    user_obj.is_active = not user_obj.is_active  # Toggle
    db.add(user_obj)
    await db.commit()
    await db.refresh(user_obj)
    return EmployeeResponse.model_validate(user_obj)

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



