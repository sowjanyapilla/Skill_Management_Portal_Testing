# from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
# from sqlalchemy.orm import Session
# from sqlalchemy import and_, or_, func

# from datetime import datetime
# from typing import List, Optional
# from sqlalchemy.orm import selectinload
# from collections import defaultdict

# from database import get_db
# from models.user import User
# from models.skill import Skill, SubSkill, SkillStatus
# from schemas.user import EmployeeAuthenticated
# from schemas.skill import SkillCreate, SkillResponse, SubSkillCreate, SubSkillResponse, SkillFilter
# from routes.auth import get_current_user

# from sqlalchemy import select
# from sqlalchemy.orm import joinedload
# from sqlalchemy.ext.asyncio import AsyncSession

# import pandas as pd
# from io import BytesIO

# router = APIRouter(prefix="/skills", tags=["skills"])

# # -------------------- Create a Skill with SubSkills --------------------
# @router.post("/", response_model=SkillResponse)
# async def create_skill(
#     skill_data: SkillCreate,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     # Check if skill already exists
#     result = await db.execute(
#         select(Skill).where(Skill.skill_name == skill_data.skill_name)
#     )
#     skill = result.scalars().first()

#     if not skill:
#         # Optionally create a new skill if it doesn't exist
#         skill = Skill(
#             skill_name=skill_data.skill_name,
#             created_at=datetime.utcnow()
#         )
#         db.add(skill)
#         await db.flush()  # get skill.id without committing

#     # Create sub-skills referencing existing skill
#     sub_skills_list = []
#     for sub_skill_data in skill_data.sub_skills:
#         sub_skill = SubSkill(
#             skill_id=skill.id,
#             user_id=current_user.id,
#             sub_skill_name=sub_skill_data.sub_skill_name,
#             employee_proficiency=sub_skill_data.employee_proficiency,
#             experience_years=sub_skill_data.experience_years,
#             has_certification=sub_skill_data.has_certification,
#             certification_file_url=sub_skill_data.certification_file_url,
#             status=SkillStatus.PENDING,
#             created_at=datetime.utcnow()
#         )
#         db.add(sub_skill)
#         await db.flush()

#         sub_skills_list.append(
#             SubSkillResponse(
#                 id=sub_skill.id,
#                 skill_id=sub_skill.skill_id,
#                 sub_skill_name=sub_skill.sub_skill_name,
#                 employee_proficiency=sub_skill.employee_proficiency,
#                 experience_years=sub_skill.experience_years,
#                 has_certification=sub_skill.has_certification,
#                 certification_file_url=sub_skill.certification_file_url,
#                 manager_proficiency=sub_skill.manager_proficiency,
#                 status=sub_skill.status,
#                 manager_comments=sub_skill.manager_comments,
#                 created_at=sub_skill.created_at,
#                 last_updated_at=sub_skill.last_updated_at
#             )
#         )

#     # Commit everything at once
#     await db.commit()

#     # Prepare main skill response
#     skill_response = SkillResponse(
#         id=skill.id,
#         user_id=current_user.id,
#         skill_name=skill.skill_name,
#         status=SkillStatus.PENDING.value,
#         created_at=skill.created_at,
#         manager_comments=None,
#         sub_skills=sub_skills_list
#     )

#     return skill_response

# @router.get("/")
# async def get_skills(db: AsyncSession = Depends(get_db)):
#     result = await db.execute(select(Skill))
#     skills = result.scalars().all()
#     return [{"id": skill.id, "skill_name": skill.skill_name} for skill in skills]

# # -------------------- Get My Skills --------------------

# @router.get("/my-skills")
# async def get_my_skills(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(10, ge=1),
#     status: str | None = Query(None, description="PENDING | APPROVED | REJECTED")
# ):
#     try:
#         # Normalize to uppercase (so 'pending', 'Pending', 'PENDING' → 'PENDING')
#         normalized_status = None
#         if status:
#             normalized_status = status.upper()
#             if normalized_status not in {"PENDING", "APPROVED", "REJECTED"}:
#                 raise HTTPException(status_code=400, detail="Invalid status")

#         # Base query
#         base_query = select(SubSkill).where(SubSkill.user_id == current_user.id)

#         # Apply status filter if given
#         if normalized_status:
#             base_query = base_query.where(SubSkill.status == normalized_status)

#         # Count total
#         total_result = await db.execute(base_query)
#         total_sub_skills = total_result.scalars().all()
#         total_count = len(total_sub_skills)

#         # Apply pagination
#         query = (
#             base_query.options(selectinload(SubSkill.skill))
#             .offset(skip)
#             .limit(limit)
#         )
#         result = await db.execute(query)
#         sub_skills = result.scalars().all()

#         # Group by skill_id
#         from collections import defaultdict
#         grouped_skills = defaultdict(list)
#         for sub in sub_skills:
#             grouped_skills[sub.skill_id].append(sub)

#         skills_data = []
#         for skill_id, subs in grouped_skills.items():
#             skills_data.append({
#                 "id": skill_id,
#                 "user_id": current_user.id,
#                 "skill_name": subs[0].skill.skill_name,
#                 "sub_skills": [
#                     {
#                         "id": sub.id,
#                         "skill_id": sub.skill_id,
#                         "sub_skill_name": sub.sub_skill_name,
#                         "proficiency_level": sub.employee_proficiency,
#                         "manager_proficiency": sub.manager_proficiency,
#                         "status": sub.status.value if sub.status else None,  # ✅ returns PENDING/APPROVED/REJECTED
#                         "manager_comments": sub.manager_comments,
#                         "experience_years": sub.experience_years,
#                         "has_certification": sub.has_certification,
#                         "certification_file_url": sub.certification_file_url,
#                         "created_at": sub.created_at,
#                     }
#                     for sub in subs
#                 ],
#                 "status": subs[0].status.value if subs[0].status else None,
#                 "manager_comments": subs[0].manager_comments,
#                 "created_at": subs[0].created_at,
#             })

#         return {
#             "skills": skills_data,
#             "total": total_count,
#             "skip": skip,
#             "limit": limit,
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Filter Skills (Optional) --------------------

# def str_to_bool(val: Optional[str]):
#     if val is None:
#         return None
#     if val.lower() in ["true", "1", "yes"]:
#         return True
#     elif val.lower() in ["false", "0", "no"]:
#         return False
#     return None

# @router.get("/matching")
# async def get_matching_skills(
#     request: Request,
#     skill: Optional[str] = None,
#     proficiency: Optional[str] = None,
#     experience: Optional[str] = None,
#     has_certification: Optional[str] = None,
#     page: int = Query(1, ge=1),
#     page_size: int = Query(5, ge=1, le=100),
#     db: AsyncSession = Depends(get_db),
# ):
#     print("Received query parameters:", request.query_params)

#     proficiency_val = int(proficiency) if proficiency is not None else None
#     experience_val = float(experience) if experience is not None else None
#     has_cert_bool = str_to_bool(has_certification)

#     stmt = select(SubSkill).options(
#         selectinload(SubSkill.skill),
#         selectinload(SubSkill.user)
#     ).where(SubSkill.status == SkillStatus.APPROVED)

#     # filters (same as your current code)
#     if skill:
#         skill_list = [s.strip() for s in skill.split(',') if s.strip()]
#         if skill_list:
#             stmt = stmt.where(
#                 or_(
#                     *[
#                         or_(
#                             SubSkill.sub_skill_name.ilike(f"%{s}%"),
#                             SubSkill.skill.has(Skill.skill_name.ilike(f"%{s}%"))
#                         )
#                         for s in skill_list
#                     ]
#                 )
#             )

#     if proficiency_val is not None:
#         stmt = stmt.where(SubSkill.employee_proficiency >= proficiency_val)

#     if experience_val is not None:
#         stmt = stmt.where(SubSkill.experience_years >= experience_val)

#     if has_cert_bool is not None:
#         stmt = stmt.where(SubSkill.has_certification == has_cert_bool)

#     # ---- COUNT total for pagination ----
#     count_stmt = stmt.with_only_columns(func.count()).order_by(None)
#     total_result = await db.execute(count_stmt)
#     total_count = total_result.scalar()

#     # ---- Apply LIMIT/OFFSET ----
#     stmt = stmt.offset((page - 1) * page_size).limit(page_size)

#     result = await db.execute(stmt)
#     sub_skills = result.scalars().all()

#     # group by skill (same as before)
#     skill_map = {}
#     for sub in sub_skills:
#         skill_name = sub.skill.skill_name
#         if skill_name not in skill_map:
#             skill_map[skill_name] = {
#                 "id": sub.skill.id,
#                 "skill_name": skill_name,
#                 "user_id": sub.user_id,
#                 "status": sub.status.value if sub.status else None,
#                 "sub_skills": [],
#             }

#         skill_map[skill_name]["sub_skills"].append({
#             "id": sub.id,
#             "skill_id": sub.skill.id,
#             "sub_skill_name": sub.sub_skill_name,
#             "employee_proficiency": sub.employee_proficiency,
#             "experience_years": sub.experience_years,
#             "has_certification": sub.has_certification,
#             "certification_file_url": sub.certification_file_url,
#             "manager_proficiency": sub.manager_proficiency,
#             "status": sub.status.value if sub.status else None,
#             "manager_comments": sub.manager_comments,
#             "created_at": sub.created_at,
#             "last_updated_at": sub.last_updated_at,
#             "employee_name": sub.user.name if sub.user else None,
#             "employee_id": sub.user.employee_id if sub.user else None,
#         })

#     return {
#         "results": list(skill_map.values()),
#         "total": total_count,
#         "page": page,
#         "page_size": page_size,
#         "total_pages": (total_count + page_size - 1) // page_size
#     }


# # -------------------- Get a Single Skill --------------------
# @router.get("/{skill_id}", response_model=SkillResponse)
# def get_skill(
#     skill_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     skill = db.query(Skill).filter(
#         and_(Skill.id == skill_id, Skill.user_id == current_user.id)
#     ).first()
#     if not skill:
#         raise HTTPException(status_code=404, detail="Skill not found")
#     return SkillResponse.model_validate(skill)

# # -------------------- Delete a Skill --------------------
# @router.delete("/{skill_id}")
# def delete_skill(
#     skill_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     skill = db.query(Skill).filter(
#         and_(Skill.id == skill_id, Skill.user_id == current_user.id)
#     ).first()
#     if not skill:
#         raise HTTPException(status_code=404, detail="Skill not found")
    
#     db.delete(skill)
#     db.commit()
#     return {"message": "Skill deleted successfully"}


# # -------------------- export skills matching users -------------------- 
# @router.get("/matching/export")
# async def export_skills_to_excel(
#     skill: str = None,
#     proficiency: str = None,
#     experience: str = None,
#     has_certification: str = None,
#     db: AsyncSession = Depends(get_db),
# ):
#     # Fetch filtered SubSkills (same logic as /matching)
#     stmt = select(SubSkill).options(
#         selectinload(SubSkill.skill),
#         selectinload(SubSkill.user)
#     ).where(SubSkill.status == SkillStatus.APPROVED)

#     # Apply filters
#     if skill:
#         skill_list = [s.strip() for s in skill.split(',') if s.strip()]
#         stmt = stmt.where(
#             or_(*[
#                 or_(
#                     SubSkill.sub_skill_name.ilike(f"%{s}%"),
#                     SubSkill.skill.has(Skill.skill_name.ilike(f"%{s}%"))
#                 ) for s in skill_list
#             ])
#         )
#     if proficiency:
#         stmt = stmt.where(SubSkill.employee_proficiency >= int(proficiency))
#     if experience:
#         stmt = stmt.where(SubSkill.experience_years >= float(experience))
#     if has_certification is not None:
#         stmt = stmt.where(SubSkill.has_certification == (has_certification.lower() == "true"))

#     result = await db.execute(stmt)
#     sub_skills = result.scalars().all()

#     # Prepare data
#     data = []
#     for sub in sub_skills:
#         data.append({
#             "Employee Name": sub.user.name if sub.user else "",
#             "Employee ID": sub.user.employee_id if sub.user else "",
#             "Skill": sub.skill.skill_name if sub.skill else "",
#             "Sub-skill": sub.sub_skill_name,
#             "Manager Proficiency": sub.manager_proficiency,
#             "Experience": sub.experience_years,
#             "Has Certification": sub.has_certification,
#         })

#     df = pd.DataFrame(data)

#     # Write to in-memory bytes buffer
#     output = BytesIO()
#     with pd.ExcelWriter(output, engine='openpyxl') as writer:
#         df.to_excel(writer, index=False)
#     output.seek(0)

#     return Response(
#         content=output.read(),
#         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         headers={"Content-Disposition": "attachment; filename=skills_export.xlsx"}
#     )



from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, Body
from sqlalchemy import and_, or_, func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime
from typing import Optional, List, Dict
from collections import defaultdict
from fastapi.responses import StreamingResponse
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

from database import get_db
from models.skill import MasterSkill, SubSkill, EmployeeSkill, SkillStatus, EmployeeSkillHistory
from models.user import Employee
from schemas.user import EmployeeAuthenticated
from schemas.skill import (
    SkillCreate, SkillResponse, SubSkillResponse
)
from routes.auth import get_current_user



router = APIRouter(prefix="/skills", tags=["Skills"])


# -------------------- Create a Skill with SubSkills --------------------
@router.post("/", response_model=SkillResponse, status_code=201)
async def create_skill(
    skill_data: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: EmployeeAuthenticated = Depends(get_current_user)
):
    # Find master skill (create if not exists)
    result = await db.execute(
        select(MasterSkill).where(MasterSkill.skill_name == skill_data.skill_name)
    )
    master_skill = result.scalars().first()
    if not master_skill:
        master_skill = MasterSkill(skill_name=skill_data.skill_name)
        db.add(master_skill)
        await db.flush()  # Get master_skill.skill_id

    employee_skills = []

    for sub_skill_data in skill_data.sub_skills:
        # Check if subskill exists
        result = await db.execute(
            select(SubSkill).where(
                SubSkill.skill_id == master_skill.skill_id,
                SubSkill.subskill_name == sub_skill_data.subskill_name
            )
        )
        sub_skill = result.scalars().first()

        if not sub_skill:
            sub_skill = SubSkill(
                skill_id=master_skill.skill_id,
                subskill_name=sub_skill_data.subskill_name,
            )
            db.add(sub_skill)
            await db.flush()  # Get sub_skill.subskill_id

        # Create EmployeeSkill
        employee_skill = EmployeeSkill(
            employee_id=current_user.id,
            subskill_id=sub_skill.subskill_id,
            experience=sub_skill_data.experience,
            proficiency=sub_skill_data.employee_proficiency,
            certification=sub_skill_data.certification,
            certification_creation_date=sub_skill_data.certification_creation_date,   # NEW
            certification_expiration_date=sub_skill_data.certification_expiration_date, # NEW
            status=SkillStatus.PENDING,
        )
        db.add(employee_skill)
        employee_skills.append((employee_skill, sub_skill))

    # Commit all changes at once
    await db.commit()

    # Refresh EmployeeSkill objects to get IDs and timestamps
    for emp_skill, sub_skill in employee_skills:
        await db.refresh(emp_skill)

    sub_skills_list = [
        SubSkillResponse(
            emp_skill_id=emp_skill.emp_skill_id,
            employee_id=emp_skill.employee_id,
            subskill_id=emp_skill.subskill_id,
            experience=emp_skill.experience,
            proficiency=emp_skill.proficiency,
            certification=emp_skill.certification,
            manager_comments=emp_skill.manager_comments,
            status=emp_skill.status.value if emp_skill.status else None,
            approver_id=emp_skill.approver_id,
            created_at=emp_skill.created_date,
            # Include NEW fields
            certification_creation_date=emp_skill.certification_creation_date,
            certification_expiration_date=emp_skill.certification_expiration_date,
        )
        for emp_skill, _ in employee_skills
    ]

    await db.refresh(master_skill)

    return SkillResponse(
        id=master_skill.skill_id,
        user_id=current_user.id,
        skill_name=master_skill.skill_name,
        status=SkillStatus.PENDING,
        manager_comments=None,
        sub_skills=sub_skills_list,
    )


# -------------------- Get All Master Skills --------------------

@router.get("/my-skills")
async def get_my_skills(
    db: AsyncSession = Depends(get_db),
    current_user: EmployeeAuthenticated = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    status: Optional[str] = Query(None, description="PENDING | APPROVED | REJECTED")
):
    normalized_status = None
    if status:
        normalized_status = status.upper()
        if normalized_status not in {"PENDING", "APPROVED", "REJECTED"}:
            raise HTTPException(status_code=400, detail="Invalid status")

    # --------------------
    # 1. Choose base model
    # --------------------
    if normalized_status == "REJECTED":
        base_query = (
            select(EmployeeSkillHistory)
            .options(selectinload(EmployeeSkillHistory.subskill).selectinload(SubSkill.master_skill))
            .where(
                EmployeeSkillHistory.employee_id == current_user.id,
                EmployeeSkillHistory.approval_status == "REJECTED"
            )
        )
        result = await db.execute(base_query)
        all_rows = result.scalars().all()

        # Flatten all subskills
        flat_subskills = [
            {
                "master_skill_id": h.subskill.master_skill.skill_id,
                "master_skill_name": h.subskill.master_skill.skill_name,
                "emp_skill_id": h.emp_skill_id,
                "employee_id": h.employee_id,
                "subskill_id": h.subskill_id,
                "sub_skill_name": h.subskill.subskill_name,
                "proficiency_level": h.proficiency,
                "manager_proficiency": h.manager_proficiency,
                "status": h.approval_status.value if h.approval_status else None,
                "manager_comments": h.manager_comments,
                "experience_years": h.experience,
                "has_certification": bool(h.certification),
                "certification_file_url": h.certification,
                "created_at": h.created_at,
            }
            for h in all_rows
        ]

    else:
        base_query = (
            select(EmployeeSkill)
            .options(selectinload(EmployeeSkill.subskill).selectinload(SubSkill.master_skill))
            .where(EmployeeSkill.employee_id == current_user.id)
        )
        if normalized_status:
            base_query = base_query.where(EmployeeSkill.status == normalized_status)

        result = await db.execute(base_query)
        all_rows = result.scalars().all()

        flat_subskills = [
            {
                "master_skill_id": es.subskill.master_skill.skill_id,
                "master_skill_name": es.subskill.master_skill.skill_name,
                "emp_skill_id": es.emp_skill_id,
                "employee_id": es.employee_id,
                "subskill_id": es.subskill_id,
                "sub_skill_name": es.subskill.subskill_name,
                "proficiency_level": es.proficiency,
                "manager_proficiency": None,
                "status": es.status.value if es.status else None,
                "manager_comments": es.manager_comments,
                "experience_years": es.experience,
                "has_certification": bool(es.certification),
                "certification_file_url": es.certification,
                "created_at": es.created_date,
            }
            for es in all_rows
        ]

    # --------------------
    # 2. Sort & Paginate at sub-skill level
    # --------------------
    flat_subskills.sort(key=lambda s: (s["master_skill_name"], s["sub_skill_name"]))
    total_count = len(flat_subskills)
    paginated = flat_subskills[skip: skip + limit]

    # --------------------
    # 3. Group back into master skills
    # --------------------
    skills_data = []
    grouped = defaultdict(list)
    for sub in paginated:
        grouped[sub["master_skill_id"]].append(sub)

    for ms_id, subs in grouped.items():
        skills_data.append({
            "id": ms_id,
            "user_id": current_user.id,
            "skill_name": subs[0]["master_skill_name"],
            "sub_skills": subs,
            "status": subs[0]["status"],
            "manager_comments": subs[0]["manager_comments"],
            "created_at": subs[0]["created_at"],
        })

    return {
        "skills": skills_data,
        "total": total_count,   # total subskills
        "skip": skip,
        "limit": limit,
    }


# Get all master skills
@router.get("/master-skills")
async def get_master_skills(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MasterSkill))
    skills = result.scalars().all()
    return [{"id": s.skill_id, "skill_name": s.skill_name} for s in skills]

# Get sub-skills by master skill
@router.get("/sub-skills/{master_skill_id}")
async def get_sub_skills(master_skill_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubSkill).where(SubSkill.skill_id == master_skill_id))
    sub_skills = result.scalars().all()
    return [{"id": s.subskill_id, "subskill_name": s.subskill_name} for s in sub_skills]

def str_to_bool(val: Optional[str]):
    if val is None:
        return None
    if val.lower() in ["true", "1", "yes"]:
        return True
    elif val.lower() in ["false", "0", "no"]:
        return False
    return None

async def compute_skill_level_coverage(
    all_employee_skills: list,
    filter_skills: list
) -> float:
    """
    Compute skill coverage percentage for an employee.
    all_employee_skills: list of EmployeeSkill + SubSkill + MasterSkill tuples
    filter_skills: list of dicts with skill_name, min_proficiency, min_experience, max_experience, require_certification
    """

    total_skills = len(filter_skills)
    if total_skills == 0:
        return 0.0

    matched_skills = 0

    for f in filter_skills:
        skill_matches = [
            s for s in all_employee_skills
            if (
                f["skill_name"].lower() in s.MasterSkill.skill_name.lower()  # match master skill
                or f["skill_name"].lower() in s.SubSkill.subskill_name.lower()  # OR match sub-skill
            )
            and (f.get("min_proficiency") is None or (s.EmployeeSkill.proficiency is not None and s.EmployeeSkill.proficiency >= f["min_proficiency"]))
            and (f.get("min_experience") is None or (s.EmployeeSkill.experience is not None and s.EmployeeSkill.experience >= f["min_experience"]))
            and (f.get("max_experience") is None or (s.EmployeeSkill.experience is not None and s.EmployeeSkill.experience <= f["max_experience"]))
            and (not f.get("require_certification", False) or s.EmployeeSkill.certification is not None)
        ]
        if skill_matches:
            matched_skills += 1

    coverage = (matched_skills / total_skills) * 100
    return round(coverage, 2)

# This is the corrected version of your /matching endpoint.
# Copy and paste this to replace the existing one in your file.

@router.get("/matching")
async def get_employee_skill_coverage(
    request: Request,
    skill: Optional[str] = None,
    proficiency: Optional[int] = None,
    min_experience: Optional[float] = None,
    max_experience: Optional[float] = None,
    has_certification: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns employees grouped by skills with coverage %.
    Pagination applied at employee level.
    """

    # Build filter list for coverage calculation
    filter_skills = []
    if skill:
        skill_list = [s.strip() for s in skill.split(",") if s.strip()]
        for s in skill_list:
            filter_skills.append({
                "skill_name": s,
                "min_proficiency": proficiency,
                "min_experience": min_experience,
                "max_experience": max_experience,
                "require_certification": has_certification,
            })

    # Step 1: Build the filtered query for matching employees
    filtered_emp_query = select(Employee).where(Employee.is_active == True)
    
    # Check if ANY filter exists before adding joins and where clauses.
    has_any_filter = skill or proficiency is not None or min_experience is not None or max_experience is not None or has_certification is not None

    if has_any_filter:
        # Explicitly join Employee to EmployeeSkill to resolve the ambiguity
        filtered_emp_query = filtered_emp_query.join(EmployeeSkill, Employee.id == EmployeeSkill.employee_id)
        
        # Now add the remaining joins
        filtered_emp_query = filtered_emp_query.join(SubSkill).join(MasterSkill)
        
        # This is the key change to handle comma-separated skills
        if skill:
            skill_list = [s.strip() for s in skill.split(",") if s.strip()]
            
            # Build a list of individual OR conditions
            skill_or_conditions = [
                or_(
                    MasterSkill.skill_name.ilike(f"%{s}%"),
                    SubSkill.subskill_name.ilike(f"%{s}%")
                ) for s in skill_list
            ]
            
            # Combine all OR conditions into one `where` clause
            filtered_emp_query = filtered_emp_query.where(or_(*skill_or_conditions))

        # Apply other filters to the joined tables
        if proficiency is not None:
            filtered_emp_query = filtered_emp_query.where(EmployeeSkill.proficiency >= proficiency)
        if min_experience is not None:
            filtered_emp_query = filtered_emp_query.where(EmployeeSkill.experience >= min_experience)
        if max_experience is not None:
            filtered_emp_query = filtered_emp_query.where(EmployeeSkill.experience <= max_experience)
        if has_certification is not None:
            if has_certification:
                filtered_emp_query = filtered_emp_query.where(EmployeeSkill.certification.isnot(None))
            else:
                filtered_emp_query = filtered_emp_query.where(EmployeeSkill.certification.is_(None))

    # Add a DISTINCT clause to ensure we only get unique employees,
    # and GROUP BY to allow counting correctly.
    filtered_emp_query = filtered_emp_query.group_by(Employee.id)

    # Step 2: Get the total count of matching employees.
    # We use a subquery to correctly count unique employees after joins and filters.
    total_count_query = select(func.count()).select_from(filtered_emp_query.subquery())
    total_matching_employees = (await db.execute(total_count_query)).scalar() or 0

    # Step 3: Apply pagination to the filtered query and execute.
    stmt = filtered_emp_query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    employees = result.scalars().all()

    # Step 4: Process the skills for this small, correctly paginated list.
    employee_results = []
    
    # The `filter_skills` list is already built correctly at the beginning.
    
    for emp in employees:
        # Fetch all skills + subskills + master skills for this specific employee.
        # This part remains the same as it correctly fetches all related data for one employee.
        stmt_skills = (
            select(EmployeeSkill, SubSkill, MasterSkill)
            .join(SubSkill, EmployeeSkill.subskill_id == SubSkill.subskill_id)
            .join(MasterSkill, SubSkill.skill_id == MasterSkill.skill_id)
            .filter(EmployeeSkill.employee_id == emp.id)
        )
        all_employee_skills = (await db.execute(stmt_skills)).all()

        # Compute coverage
        coverage = 0.0
        if filter_skills:
            coverage = await compute_skill_level_coverage(all_employee_skills, filter_skills)

        skills_dict: dict[str, list] = {}

        for emp_skill, subskill, master_skill in all_employee_skills:
            key = master_skill.skill_name

            # This inner loop also needs to handle the individual skills from the filter list.
            if filter_skills:
                matched = False
                for f in filter_skills:
                    if (
                        f["skill_name"].lower() in master_skill.skill_name.lower()
                        or f["skill_name"].lower() in subskill.subskill_name.lower()
                    ) and (
                        f.get("min_proficiency") is None or (emp_skill.proficiency or 0) >= f["min_proficiency"]
                    ) and (
                        f.get("min_experience") is None or (emp_skill.experience or 0) >= f["min_experience"]
                    ) and (
                        f.get("max_experience") is None or (emp_skill.experience or 0) <= f["max_experience"]
                    ) and (
                        f.get("require_certification") is None or (bool(emp_skill.certification) == f["require_certification"])
                    ):
                        matched = True
                        break

                if not matched:
                    continue

            if key not in skills_dict:
                skills_dict[key] = []

            skills_dict[key].append({
                "name": subskill.subskill_name,
                "proficiency": emp_skill.proficiency,
                "experience": emp_skill.experience,
                "hasCertification": bool(emp_skill.certification),
                "status": emp_skill.status.value if emp_skill.status else "PENDING",
                "certificationFile": emp_skill.certification,
                "certificationCreationDate": getattr(emp_skill, "certification_creation_date", None),
                "certificationExpirationDate": getattr(emp_skill, "certification_expiration_date", None),
            })
        
        if not skills_dict:
             continue

        skills_info = []
        for skill_name, subskills in skills_dict.items():
            matched = len([s for s in subskills if s["proficiency"] is not None and s["proficiency"] > 0])
            skills_info.append({
                "skill_name": skill_name,
                "matched_subskills": matched,
                "total_subskills": len(subskills),
                "sub_skills": subskills,
            })

        employee_results.append({
            "employee_id": emp.emp_id,
            "employee_name": emp.name,
            "coverage": coverage,
            "skills": skills_info,
        })
    
    total_pages = (total_matching_employees + page_size - 1) // page_size

    return {
        "results": employee_results,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "total_employees": total_matching_employees,
    }

# # -------------------- export skills matching users -------------------- 
@router.get("/matching/export")
async def export_employee_skills(
    skill: str | None = None,
    proficiency: int | None = None,
    min_experience: float | None = None,
    max_experience: float | None = None,
    has_certification: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Export all employees (not paginated) with their grouped skills into Excel.
    Applies main filters + table header filters.
    """

    # Build filter list
    filter_skills = []
    skill_list = []
    if skill:
        skill_list = [s.strip() for s in skill.split(",") if s.strip()]
        for s in skill_list:
            filter_skills.append({
                "skill_name": s,
                "min_proficiency": proficiency,
                "min_experience": min_experience,
                "max_experience": max_experience,
                "require_certification": has_certification,
            })

    # ✅ Fetch all employees (no pagination here)
    stmt = select(Employee).where(Employee.is_active == True)
    result = await db.execute(stmt)
    employees = result.scalars().all()

    # Excel workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Employee Skills"

    # Header row
    headers = [
        "Employee Name", "Employee ID",
        "Skill", "Sub-skill",
        "Proficiency", "Experience (yrs)",
        "Certification", "Status",
        "Coverage (%)"
    ]
    ws.append(headers)

    # Style headers
    for col in range(1, len(headers)+1):
        cell = ws.cell(row=1, column=col)
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="DDDDDD", end_color="DDDDDD", fill_type="solid")
        cell.alignment = Alignment(horizontal="center")

    # Fill data
    for emp in employees:
        stmt_skills = (
            select(EmployeeSkill, SubSkill, MasterSkill)
            .join(SubSkill, EmployeeSkill.subskill_id == SubSkill.subskill_id)
            .join(MasterSkill, SubSkill.skill_id == MasterSkill.skill_id)
            .filter(EmployeeSkill.employee_id == emp.id)
        )
        all_employee_skills = (await db.execute(stmt_skills)).all()

        if not all_employee_skills:
            continue

        # Compute coverage
        coverage = 0.0
        if filter_skills:
            coverage = await compute_skill_level_coverage(all_employee_skills, filter_skills)

        skills_dict = {}
        for emp_skill, subskill, master_skill in all_employee_skills:
            key = master_skill.skill_name

            if key not in skills_dict:
                skills_dict[key] = []

            skills_dict[key].append({
                "name": subskill.subskill_name,
                "proficiency": emp_skill.proficiency,
                "experience": emp_skill.experience,
                "hasCertification": bool(emp_skill.certification),
                "status": emp_skill.status.value if emp_skill.status else "PENDING",
            })

        # Skip employees with no matching subskills
        if not skills_dict:
            continue

        first_row_for_employee = True
        for skill_name, subskills in skills_dict.items():
            first_row_for_skill = True
            for sub in subskills:
                row = [
                    emp.name if first_row_for_employee else "",
                    emp.emp_id if first_row_for_employee else "",
                    skill_name if first_row_for_skill else "",
                    sub["name"],
                    sub["proficiency"],
                    sub["experience"],
                    "Certified" if sub["hasCertification"] else "Not Certified",
                    sub["status"],
                    coverage if first_row_for_employee else ""
                ]
                ws.append(row)
                first_row_for_employee = False
                first_row_for_skill = False

        # Add empty row between employees
        ws.append([])

    # Save to BytesIO
    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)

    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=employee_skills.xlsx"}
    )



@router.put("/update-skill/{record_type}/{record_id}")
async def update_skill(
    record_type: str,  # "employee_skill" or "history"
    record_id: int,    # emp_skill_id or history_id
    skill_data: SkillCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: EmployeeAuthenticated = Depends(get_current_user)
):
    """
    Update skill behavior based on record type:
    - employee_skill: PENDING / APPROVED
    - history: REJECTED
    """

    # Normalize record_type
    record_type = record_type.lower()

    # --------------------
    # 1️⃣ Fetch existing record to populate the form
    # --------------------
    if record_type == "employee_skill":
        result = await db.execute(
            select(EmployeeSkill)
            .where(EmployeeSkill.emp_skill_id == record_id)
        )
        record = result.scalars().first()
        if not record:
            raise HTTPException(status_code=404, detail="EmployeeSkill record not found")

    elif record_type == "history":
        result = await db.execute(
            select(EmployeeSkillHistory)
            .where(EmployeeSkillHistory.history_id == record_id)
        )
        record = result.scalars().first()
        if not record:
            raise HTTPException(status_code=404, detail="EmployeeSkillHistory record not found")

    else:
        raise HTTPException(status_code=400, detail="Invalid record_type")

    # --------------------
    # 2️⃣ Determine employee_id + subskill_id
    # --------------------
    employee_id = record.employee_id
    subskill_id = record.subskill_id

    # --------------------
    # 3️⃣ Check if EmployeeSkill exists for REJECTED history
    # --------------------
    existing_emp_skill = None
    if record_type == "history":
        result = await db.execute(
            select(EmployeeSkill).where(
                EmployeeSkill.employee_id == employee_id,
                EmployeeSkill.subskill_id == subskill_id
            )
        )
        existing_emp_skill = result.scalars().first()

    # --------------------
    # 4️⃣ Update / Insert logic
    # --------------------
    target_skill = None

    if record_type == "employee_skill" or existing_emp_skill:
        # Update existing EmployeeSkill
        target_skill = existing_emp_skill if existing_emp_skill else record
        target_skill.experience = skill_data.sub_skills[0].experience
        target_skill.proficiency = skill_data.sub_skills[0].employee_proficiency
        target_skill.certification = skill_data.sub_skills[0].certification
        target_skill.certification_creation_date = skill_data.sub_skills[0].certification_creation_date
        target_skill.certification_expiration_date = skill_data.sub_skills[0].certification_expiration_date
        target_skill.status = SkillStatus.PENDING

    else:
        # Insert new EmployeeSkill
        new_skill = EmployeeSkill(
            employee_id=employee_id,
            subskill_id=subskill_id,
            experience=skill_data.sub_skills[0].experience,
            proficiency=skill_data.sub_skills[0].employee_proficiency,
            certification=skill_data.sub_skills[0].certification,
            certification_creation_date=skill_data.sub_skills[0].certification_creation_date,
            certification_expiration_date=skill_data.sub_skills[0].certification_expiration_date,
            status=SkillStatus.PENDING
        )
        db.add(new_skill)
        target_skill = new_skill

    await db.commit()
    await db.refresh(target_skill)

    return {
        "message": "Skill updated successfully",
        "employee_id": target_skill.employee_id,
        "subskill_id": target_skill.subskill_id,
        "status": target_skill.status.value
    }
