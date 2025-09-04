# Add these imports at the top of your skills.py file if not already present

from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import  APIRouter,Depends, HTTPException, Query
from sqlalchemy import func, select,  or_
from sqlalchemy.ext.asyncio import AsyncSession

from typing import  List, Dict
from collections import defaultdict


from database import get_db
from models.skill import MasterSkill, SubSkill, EmployeeSkill
from models.user import Employee



from sqlalchemy import case, distinct
from sqlalchemy.orm import joinedload
from typing import Dict, Any, Optional

# =====================================================================
#                 NEW DASHBOARD ENDPOINTS
# =====================================================================

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/master-skills", response_model=Dict[str, Any])
async def get_dashboard_master_skills(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by master skill or sub-skill name")
):
    """
    Returns a paginated list of master skills filtered by an optional search query.
    """
    # Get total number of active employees for percentage
    total_employees_result = await db.execute(select(func.count(distinct(Employee.id))).where(Employee.is_active == True))
    total_employees = total_employees_result.scalar() or 0

    # Base query for master skills with employee count
    base_query = select(
        MasterSkill.skill_id,
        MasterSkill.skill_name,
        func.count(distinct(EmployeeSkill.employee_id)).label("employee_count")
    ).outerjoin(SubSkill, MasterSkill.skill_id == SubSkill.skill_id).outerjoin(EmployeeSkill, SubSkill.subskill_id == EmployeeSkill.subskill_id).group_by(MasterSkill.skill_id, MasterSkill.skill_name)
    
    # Apply search filter if provided
    if search:
        search_filter = or_(
            MasterSkill.skill_name.ilike(f"%{search}%"),
            SubSkill.subskill_name.ilike(f"%{search}%")
        )
        base_query = base_query.filter(search_filter)
    
    # Get total number of master skills after filtering
    total_skills_count_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total_skills = total_skills_count_result.scalar() or 0
    
    # Apply pagination to the main query
    skip = (page - 1) * page_size
    paginated_query = base_query.offset(skip).limit(page_size).order_by(MasterSkill.skill_name)
    paginated_result = await db.execute(paginated_query)
    
    master_skill_data = paginated_result.fetchall()

    return {
        "master_skills": [
            {
                "id": row.skill_id,
                "skill_name": row.skill_name,
                "employee_count": row.employee_count,
                "total_employees": total_employees
            }
            for row in master_skill_data
        ],
        "total_skills": total_skills,
        "page": page,
        "page_size": page_size
    }

@router.get("/master-skill/{skill_id}")
async def get_master_skill_metrics(skill_id: int, db: AsyncSession = Depends(get_db)):
    """
    Provides detailed metrics for a single master skill, including:
    - Overall coverage (employees with skill vs without)
    - Sub-skill employee percentage breakdown
    """
    master_skill_result = await db.execute(select(MasterSkill).where(MasterSkill.skill_id == skill_id))
    master_skill = master_skill_result.scalars().first()
    if not master_skill:
        raise HTTPException(status_code=404, detail="Master skill not found")

    # Get total number of employees for percentage calculation
    total_employees_result = await db.execute(select(func.count(distinct(Employee.id))).where(Employee.is_active == True))
    total_employees = total_employees_result.scalar() or 0
    
    # Get employees with this master skill
    employees_with_skill_query = select(func.count(distinct(EmployeeSkill.employee_id))).join(SubSkill).where(SubSkill.skill_id == skill_id)
    employees_with_skill_result = await db.execute(employees_with_skill_query)
    employees_with_skill_count = employees_with_skill_result.scalar() or 0
    
    # Sub-skill breakdown (percentage of employees with that sub-skill)
    # 🚨 CORRECTED: Now includes subskill_id
    subskill_breakdown_query = select(
        SubSkill.subskill_id,
        SubSkill.subskill_name,
        func.count(distinct(EmployeeSkill.employee_id)).label("employee_count")
    ).outerjoin(EmployeeSkill).where(SubSkill.skill_id == skill_id).group_by(SubSkill.subskill_id, SubSkill.subskill_name)
    
    subskill_breakdown_result = await db.execute(subskill_breakdown_query)
    subskill_breakdown_data = [
        {
            "subskill_id": row.subskill_id,
            "subskill_name": row.subskill_name,
            "employee_percentage": round((row.employee_count / total_employees) * 100, 2)
        }
        for row in subskill_breakdown_result.fetchall()
    ]
    
    return {
        "skill_name": master_skill.skill_name,
        "total_employees": total_employees,
        "employees_with_skill_count": employees_with_skill_count,
        "subskill_breakdown": subskill_breakdown_data
    }

@router.get("/sub-skill/{subskill_id}")
async def get_subskill_metrics(subskill_id: int, db: AsyncSession = Depends(get_db)):
    """
    Provides detailed metrics for a single sub-skill:
    - Overall coverage
    - Experience distribution
    - Proficiency distribution
    - Certification distribution
    """
    subskill_result = await db.execute(select(SubSkill).where(SubSkill.subskill_id == subskill_id).options(joinedload(SubSkill.master_skill)))
    subskill = subskill_result.scalars().first()
    if not subskill:
        raise HTTPException(status_code=404, detail="Sub-skill not found")

    # Total employees for percentage calculations
    total_employees_result = await db.execute(select(func.count(distinct(Employee.id))).where(Employee.is_active == True))
    total_employees = total_employees_result.scalar() or 0

    # Employees with this specific sub-skill
    employees_with_subskill_result = await db.execute(
        select(EmployeeSkill)
        .where(EmployeeSkill.subskill_id == subskill_id)
        .options(joinedload(EmployeeSkill.employee))
    )
    employees_with_subskill = employees_with_subskill_result.scalars().all()
    employees_with_subskill_count = len(employees_with_subskill)

    # Certification breakdown
    certified_count = sum(1 for es in employees_with_subskill if es.certification)
    non_certified_count = employees_with_subskill_count - certified_count
    
    certification_data = [
        {"name": "Certified", "value": certified_count},
        {"name": "Non-Certified", "value": non_certified_count}
    ]

    # Proficiency distribution
    proficiency_counts = defaultdict(int)
    for es in employees_with_subskill:
        if es.proficiency:
            proficiency_counts[es.proficiency] += 1
    
    proficiency_data = [
        {"proficiency": f"{p} Stars", "count": c}
        for p, c in sorted(proficiency_counts.items())
    ]
    
    # 🚨 UPDATED Experience distribution logic
    experience_buckets = defaultdict(int)
    for es in employees_with_subskill:
        experience = es.experience if es.experience is not None else 0
        if experience < 1:
            experience_buckets["< 1 year"] += 1
        elif 1 <= experience < 2:
            experience_buckets["1-2 years"] += 1
        elif 2 <= experience < 3:
            experience_buckets["2-3 years"] += 1
        elif 3 <= experience < 4:
            experience_buckets["3-4 years"] += 1
        elif 4 <= experience < 5:
            experience_buckets["4-5 years"] += 1
        elif 5 <= experience < 6:
            experience_buckets["5-6 years"] += 1
        elif 6 <= experience < 7:
            experience_buckets["6-7 years"] += 1
        elif 7 <= experience < 8:
            experience_buckets["7-8 years"] += 1
        elif 8 <= experience < 9:
            experience_buckets["8-9 years"] += 1
        elif 9 <= experience < 10:
            experience_buckets["9-10 years"] += 1
        else:
            experience_buckets["10+ years"] += 1

    experience_data = [
        {"bucket": bucket, "count": count}
        for bucket, count in experience_buckets.items()
    ]
    
    return {
        "subskill_name": subskill.subskill_name,
        "total_employees": total_employees,
        "employees_with_subskill_count": employees_with_subskill_count,
        "certification_data": certification_data,
        "proficiency_data": proficiency_data,
        "experience_data": experience_data
    }