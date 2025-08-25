from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import selectinload
from collections import defaultdict

from database import get_db
from models.user import User
from models.skill import Skill, SubSkill, SkillStatus
from schemas.user import UserAuthenticated
from schemas.skill import SkillCreate, SkillResponse, SubSkillCreate, SubSkillResponse, SkillFilter
from routes.auth import get_current_user

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

import pandas as pd
from io import BytesIO

router = APIRouter(prefix="/skills", tags=["skills"])

# -------------------- Create a Skill with SubSkills --------------------
@router.post("/", response_model=SkillResponse)
async def create_skill(
    skill_data: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if skill already exists
    result = await db.execute(
        select(Skill).where(Skill.skill_name == skill_data.skill_name)
    )
    skill = result.scalars().first()

    if not skill:
        # Optionally create a new skill if it doesn't exist
        skill = Skill(
            skill_name=skill_data.skill_name,
            created_at=datetime.utcnow()
        )
        db.add(skill)
        await db.flush()  # get skill.id without committing

    # Create sub-skills referencing existing skill
    sub_skills_list = []
    for sub_skill_data in skill_data.sub_skills:
        sub_skill = SubSkill(
            skill_id=skill.id,
            user_id=current_user.id,
            sub_skill_name=sub_skill_data.sub_skill_name,
            employee_proficiency=sub_skill_data.employee_proficiency,
            experience_years=sub_skill_data.experience_years,
            has_certification=sub_skill_data.has_certification,
            certification_file_url=sub_skill_data.certification_file_url,
            status=SkillStatus.PENDING,
            created_at=datetime.utcnow()
        )
        db.add(sub_skill)
        await db.flush()

        sub_skills_list.append(
            SubSkillResponse(
                id=sub_skill.id,
                skill_id=sub_skill.skill_id,
                sub_skill_name=sub_skill.sub_skill_name,
                employee_proficiency=sub_skill.employee_proficiency,
                experience_years=sub_skill.experience_years,
                has_certification=sub_skill.has_certification,
                certification_file_url=sub_skill.certification_file_url,
                manager_proficiency=sub_skill.manager_proficiency,
                status=sub_skill.status,
                manager_comments=sub_skill.manager_comments,
                created_at=sub_skill.created_at,
                last_updated_at=sub_skill.last_updated_at
            )
        )

    # Commit everything at once
    await db.commit()

    # Prepare main skill response
    skill_response = SkillResponse(
        id=skill.id,
        user_id=current_user.id,
        skill_name=skill.skill_name,
        status=SkillStatus.PENDING.value,
        created_at=skill.created_at,
        manager_comments=None,
        sub_skills=sub_skills_list
    )

    return skill_response

@router.get("/")
async def get_skills(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill))
    skills = result.scalars().all()
    return [{"id": skill.id, "skill_name": skill.skill_name} for skill in skills]

# -------------------- Get My Skills --------------------

@router.get("/my-skills")
async def get_my_skills(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    status: str | None = Query(None, description="PENDING | APPROVED | REJECTED")
):
    try:
        # Normalize to uppercase (so 'pending', 'Pending', 'PENDING' → 'PENDING')
        normalized_status = None
        if status:
            normalized_status = status.upper()
            if normalized_status not in {"PENDING", "APPROVED", "REJECTED"}:
                raise HTTPException(status_code=400, detail="Invalid status")

        # Base query
        base_query = select(SubSkill).where(SubSkill.user_id == current_user.id)

        # Apply status filter if given
        if normalized_status:
            base_query = base_query.where(SubSkill.status == normalized_status)

        # Count total
        total_result = await db.execute(base_query)
        total_sub_skills = total_result.scalars().all()
        total_count = len(total_sub_skills)

        # Apply pagination
        query = (
            base_query.options(selectinload(SubSkill.skill))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        sub_skills = result.scalars().all()

        # Group by skill_id
        from collections import defaultdict
        grouped_skills = defaultdict(list)
        for sub in sub_skills:
            grouped_skills[sub.skill_id].append(sub)

        skills_data = []
        for skill_id, subs in grouped_skills.items():
            skills_data.append({
                "id": skill_id,
                "user_id": current_user.id,
                "skill_name": subs[0].skill.skill_name,
                "sub_skills": [
                    {
                        "id": sub.id,
                        "skill_id": sub.skill_id,
                        "sub_skill_name": sub.sub_skill_name,
                        "proficiency_level": sub.employee_proficiency,
                        "manager_proficiency": sub.manager_proficiency,
                        "status": sub.status.value if sub.status else None,  # ✅ returns PENDING/APPROVED/REJECTED
                        "manager_comments": sub.manager_comments,
                        "experience_years": sub.experience_years,
                        "has_certification": sub.has_certification,
                        "certification_file_url": sub.certification_file_url,
                        "created_at": sub.created_at,
                    }
                    for sub in subs
                ],
                "status": subs[0].status.value if subs[0].status else None,
                "manager_comments": subs[0].manager_comments,
                "created_at": subs[0].created_at,
            })

        return {
            "skills": skills_data,
            "total": total_count,
            "skip": skip,
            "limit": limit,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Filter Skills (Optional) --------------------

def str_to_bool(val: Optional[str]):
    if val is None:
        return None
    if val.lower() in ["true", "1", "yes"]:
        return True
    elif val.lower() in ["false", "0", "no"]:
        return False
    return None

@router.get("/matching")
async def get_matching_skills(
    request: Request,
    skill: Optional[str] = None,
    proficiency: Optional[str] = None,
    experience: Optional[str] = None,
    has_certification: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    print("Received query parameters:", request.query_params)

    proficiency_val = int(proficiency) if proficiency is not None else None
    experience_val = float(experience) if experience is not None else None
    has_cert_bool = str_to_bool(has_certification)

    stmt = select(SubSkill).options(
        selectinload(SubSkill.skill),
        selectinload(SubSkill.user)
    ).where(SubSkill.status == SkillStatus.APPROVED)

    # filters (same as your current code)
    if skill:
        skill_list = [s.strip() for s in skill.split(',') if s.strip()]
        if skill_list:
            stmt = stmt.where(
                or_(
                    *[
                        or_(
                            SubSkill.sub_skill_name.ilike(f"%{s}%"),
                            SubSkill.skill.has(Skill.skill_name.ilike(f"%{s}%"))
                        )
                        for s in skill_list
                    ]
                )
            )

    if proficiency_val is not None:
        stmt = stmt.where(SubSkill.employee_proficiency >= proficiency_val)

    if experience_val is not None:
        stmt = stmt.where(SubSkill.experience_years >= experience_val)

    if has_cert_bool is not None:
        stmt = stmt.where(SubSkill.has_certification == has_cert_bool)

    # ---- COUNT total for pagination ----
    count_stmt = stmt.with_only_columns(func.count()).order_by(None)
    total_result = await db.execute(count_stmt)
    total_count = total_result.scalar()

    # ---- Apply LIMIT/OFFSET ----
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    sub_skills = result.scalars().all()

    # group by skill (same as before)
    skill_map = {}
    for sub in sub_skills:
        skill_name = sub.skill.skill_name
        if skill_name not in skill_map:
            skill_map[skill_name] = {
                "id": sub.skill.id,
                "skill_name": skill_name,
                "user_id": sub.user_id,
                "status": sub.status.value if sub.status else None,
                "sub_skills": [],
            }

        skill_map[skill_name]["sub_skills"].append({
            "id": sub.id,
            "skill_id": sub.skill.id,
            "sub_skill_name": sub.sub_skill_name,
            "employee_proficiency": sub.employee_proficiency,
            "experience_years": sub.experience_years,
            "has_certification": sub.has_certification,
            "certification_file_url": sub.certification_file_url,
            "manager_proficiency": sub.manager_proficiency,
            "status": sub.status.value if sub.status else None,
            "manager_comments": sub.manager_comments,
            "created_at": sub.created_at,
            "last_updated_at": sub.last_updated_at,
            "employee_name": sub.user.name if sub.user else None,
            "employee_id": sub.user.employee_id if sub.user else None,
        })

    return {
        "results": list(skill_map.values()),
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }


# -------------------- Get a Single Skill --------------------
@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skill = db.query(Skill).filter(
        and_(Skill.id == skill_id, Skill.user_id == current_user.id)
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return SkillResponse.model_validate(skill)

# -------------------- Delete a Skill --------------------
@router.delete("/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skill = db.query(Skill).filter(
        and_(Skill.id == skill_id, Skill.user_id == current_user.id)
    ).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted successfully"}


# -------------------- export skills matching users -------------------- 
@router.get("/matching/export")
async def export_skills_to_excel(
    skill: str = None,
    proficiency: str = None,
    experience: str = None,
    has_certification: str = None,
    db: AsyncSession = Depends(get_db),
):
    # Fetch filtered SubSkills (same logic as /matching)
    stmt = select(SubSkill).options(
        selectinload(SubSkill.skill),
        selectinload(SubSkill.user)
    ).where(SubSkill.status == SkillStatus.APPROVED)

    # Apply filters
    if skill:
        skill_list = [s.strip() for s in skill.split(',') if s.strip()]
        stmt = stmt.where(
            or_(*[
                or_(
                    SubSkill.sub_skill_name.ilike(f"%{s}%"),
                    SubSkill.skill.has(Skill.skill_name.ilike(f"%{s}%"))
                ) for s in skill_list
            ])
        )
    if proficiency:
        stmt = stmt.where(SubSkill.employee_proficiency >= int(proficiency))
    if experience:
        stmt = stmt.where(SubSkill.experience_years >= float(experience))
    if has_certification is not None:
        stmt = stmt.where(SubSkill.has_certification == (has_certification.lower() == "true"))

    result = await db.execute(stmt)
    sub_skills = result.scalars().all()

    # Prepare data
    data = []
    for sub in sub_skills:
        data.append({
            "Employee Name": sub.user.name if sub.user else "",
            "Employee ID": sub.user.employee_id if sub.user else "",
            "Skill": sub.skill.skill_name if sub.skill else "",
            "Sub-skill": sub.sub_skill_name,
            "Manager Proficiency": sub.manager_proficiency,
            "Experience": sub.experience_years,
            "Has Certification": sub.has_certification,
        })

    df = pd.DataFrame(data)

    # Write to in-memory bytes buffer
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    return Response(
        content=output.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=skills_export.xlsx"}
    )