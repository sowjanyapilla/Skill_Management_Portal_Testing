# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from sqlalchemy import and_
# from typing import List
# from datetime import datetime

# from database import get_db
# from models.user import User
# from models.skill import Skill, SubSkill, SkillSubmission, SubSkillSubmission, SkillStatus
# from schemas.skill import SkillSubmissionResponse, SkillApprovalRequest
# from routes.auth import get_current_user

# router = APIRouter(prefix="/approvals", tags=["approvals"])

# @router.get("/pending", response_model=List[SkillSubmissionResponse])
# async def get_pending_approvals(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     if not current_user.is_manager:
#         raise HTTPException(status_code=403, detail="Only managers can view approvals")
    
#     # Get pending submissions from subordinates
#     pending_submissions = db.query(SkillSubmission).join(User).filter(
#         and_(
#             User.manager_id == current_user.id,
#             SkillSubmission.status == SkillStatus.PENDING
#         )
#     ).all()
    
#     return [SkillSubmissionResponse.from_orm(submission) for submission in pending_submissions]

# @router.get("/all", response_model=List[SkillSubmissionResponse])
# async def get_all_approvals(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     if not current_user.is_manager:
#         raise HTTPException(status_code=403, detail="Only managers can view approvals")
    
#     # Get all submissions from subordinates
#     submissions = db.query(SkillSubmission).join(User).filter(
#         User.manager_id == current_user.id
#     ).all()
    
#     return [SkillSubmissionResponse.from_orm(submission) for submission in submissions]

# @router.post("/{submission_id}/approve")
# async def approve_skill_submission(
#     submission_id: int,
#     approval_data: SkillApprovalRequest,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     if not current_user.is_manager:
#         raise HTTPException(status_code=403, detail="Only managers can approve skills")
    
#     # Get the submission
#     submission = db.query(SkillSubmission).join(User).filter(
#         and_(
#             SkillSubmission.id == submission_id,
#             User.manager_id == current_user.id,
#             SkillSubmission.status == SkillStatus.PENDING
#         )
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found or already processed")
    
#     # Update submission status
#     if approval_data.action == "approve":
#         submission.status = SkillStatus.APPROVED
        
#         # Create approved skill and sub-skills
#         approved_skill = Skill(
#             user_id=submission.user_id,
#             skill_name=submission.skill_name,
#             status=SkillStatus.APPROVED,
#             manager_comments=approval_data.manager_comments
#         )
#         db.add(approved_skill)
#         db.commit()
#         db.refresh(approved_skill)
        
#         # Create sub-skills
#         for sub_submission in submission.sub_skill_submissions:
#             proficiency = sub_submission.proficiency_level
            
#             # Apply proficiency modifications if provided
#             if (approval_data.proficiency_modifications and 
#                 str(sub_submission.id) in approval_data.proficiency_modifications):
#                 proficiency = approval_data.proficiency_modifications[str(sub_submission.id)]
            
#             sub_skill = SubSkill(
#                 skill_id=approved_skill.id,
#                 sub_skill_name=sub_submission.sub_skill_name,
#                 proficiency_level=proficiency,
#                 experience_years=sub_submission.experience_years,
#                 has_certification=sub_submission.has_certification,
#                 certification_file_url=sub_submission.certification_file_url
#             )
#             db.add(sub_skill)
        
#     elif approval_data.action == "reject":
#         submission.status = SkillStatus.REJECTED
#     else:
#         raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
#     # Update submission metadata
#     submission.manager_comments = approval_data.manager_comments
#     submission.reviewed_at = datetime.utcnow()
#     submission.approved_by_id = current_user.id
    
#     db.commit()
#     db.refresh(submission)
    
#     return {
#         "message": f"Skill submission {approval_data.action}d successfully",
#         "submission": SkillSubmissionResponse.from_orm(submission)
#     }

# @router.get("/{submission_id}", response_model=SkillSubmissionResponse)
# async def get_skill_submission(
#     submission_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     if not current_user.is_manager:
#         raise HTTPException(status_code=403, detail="Only managers can view submissions")
    
#     submission = db.query(SkillSubmission).join(User).filter(
#         and_(
#             SkillSubmission.id == submission_id,
#             User.manager_id == current_user.id
#         )
#     ).first()
    
#     if not submission:
#         raise HTTPException(status_code=404, detail="Submission not found")
    
#     return SkillSubmissionResponse.from_orm(submission)


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import SubSkill, SkillStatus, User, Skill

router = APIRouter(prefix="/approvals", tags=["Approvals"])

# @router.get("/")
# async def get_approvals(
#     manager_id: int,
#     status: SkillStatus = Query(..., description="Filter by status: pending, approved, rejected"),
#     db: AsyncSession = Depends(get_db)
# ):
#     # Query SubSkills with eager-loading for user + skill
#     stmt = (
#         select(SubSkill)
#         .options(
#             selectinload(SubSkill.user),   # eager load user
#             selectinload(SubSkill.skill)   # eager load skill
#         )
#         .join(SubSkill.user)  # join to filter by manager
#         .where(
#             SubSkill.status == status,
#             User.manager_id == manager_id
#         )
#     )

#     result = await db.execute(stmt)
#     subskills = result.scalars().all()

#     # Build response
#     results = []
#     for sub in subskills:
#         results.append({
#             "id": sub.id,
#             "sub_skill_name": sub.sub_skill_name,
#             "employee_proficiency": sub.employee_proficiency,
#             "experience_years": sub.experience_years,
#             "has_certification": sub.has_certification,
#             "certification_file_url": sub.certification_file_url,
#             "created_at": sub.created_at,
#             "status": sub.status.value,

#             # Manager review fields
#             "manager_proficiency": sub.manager_proficiency,
#             "manager_comments": sub.manager_comments,
#             "update_at":sub.last_updated_at,
#             # Relations
#             "employee": {
#                 "id": sub.user.id,
#                 "name": sub.user.name,
#                 "email": sub.user.email,
#                 "employee_id": sub.user.employee_id,
#                 "designation": sub.user.designation,
#                 "capability": sub.user.capability,
#             },
#             "skill": {
#                 "id": sub.skill.id,
#                 "skill_name": sub.skill.skill_name,
#             }
#         })

#     return {f"{status.value}_approvals": results}

from sqlalchemy import func

@router.get("/")
async def get_approvals(
    manager_id: int,
    status: SkillStatus = Query(..., description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    employee_name: str | None = None,
    skill_name: str | None = None,
    sub_skill_name: str | None = None,  # 👈 NEW filter
    has_certification: bool | None = None,
    min_experience: int | None = None,  # 👈 NEW filter
    db: AsyncSession = Depends(get_db),
):
    base_stmt = (
        select(SubSkill)
        .options(
            selectinload(SubSkill.user),
            selectinload(SubSkill.skill)
        )
        .join(SubSkill.user)
        .where(
            SubSkill.status == status,
            User.manager_id == manager_id
        )
    )

    # 🔍 Apply optional filters
    if employee_name:
        base_stmt = base_stmt.where(User.name.ilike(f"%{employee_name}%"))

    if skill_name:
        base_stmt = base_stmt.join(SubSkill.skill).where(Skill.skill_name.ilike(f"%{skill_name}%"))

    if sub_skill_name:
        base_stmt = base_stmt.where(SubSkill.sub_skill_name.ilike(f"%{sub_skill_name}%"))

    if has_certification is not None:
        base_stmt = base_stmt.where(SubSkill.has_certification == has_certification)

    if min_experience is not None:
        base_stmt = base_stmt.where(SubSkill.experience_years >= min_experience)

    # 📊 Count total first
    total_stmt = select(func.count()).select_from(base_stmt.subquery())
    total_result = await db.execute(total_stmt)
    total = total_result.scalar()

    # 📑 Apply ordering & pagination
    stmt = (
        base_stmt
        .order_by(SubSkill.created_at.desc())  # 👈 Order by newest first
        .offset((page - 1) * limit)
        .limit(limit)
    )

    result = await db.execute(stmt)
    subskills = result.scalars().all()

    # 🔄 Build response
    results = []
    for sub in subskills:
        results.append({
            "id": sub.id,
            "sub_skill_name": sub.sub_skill_name,
            "employee_proficiency": sub.employee_proficiency,
            "experience_years": sub.experience_years,
            "has_certification": sub.has_certification,
            "certification_file_url": sub.certification_file_url,
            "created_at": sub.created_at,
            "status": sub.status.value,
            "manager_proficiency": sub.manager_proficiency,
            "manager_comments": sub.manager_comments,
            "updated_at": sub.last_updated_at,
            "employee": {
                "id": sub.user.id,
                "name": sub.user.name,
                "email": sub.user.email,
                "employee_id": sub.user.employee_id,
                "designation": sub.user.designation,
                "capability": sub.user.capability,
            },
            "skill": {
                "id": sub.skill.id,
                "skill_name": sub.skill.skill_name,
            }
        })

    return {
        "records": results,
        "total": total,
        "page": page,
        "limit": limit
    }


from fastapi import Body
from sqlalchemy import update
from sqlalchemy.exc import NoResultFound
from datetime import datetime
@router.put("/{submission_id}", response_model=dict)
async def update_approval(
    submission_id: int,
    action: str = Body(..., description="Action: approve or reject"),
    proficiency: int | None = Body(None, description="Manager proficiency"),
    comments: str | None = Body(None, description="Manager comments"),
    db: AsyncSession = Depends(get_db)
):
    # Validate action
    if action not in ("approve", "reject"):
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Must be 'approve' or 'reject'."
        )

    # Fetch the submission
    stmt = select(SubSkill).where(SubSkill.id == submission_id)
    result = await db.execute(stmt)
    subskill = result.scalar_one_or_none()

    if not subskill:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if subskill.status != SkillStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending submissions can be updated."
        )

    # Update only required fields
    subskill.status = SkillStatus.APPROVED if action == "approve" else SkillStatus.REJECTED
    if proficiency is not None:
        subskill.manager_proficiency = proficiency
    if comments is not None:
        subskill.manager_comments = comments
    
    subskill.updated_at = datetime.utcnow()  # backend handles updated_at

    db.add(subskill)
    await db.commit()

    # Return only id and status
    return {
        "id": subskill.id,
        "status": subskill.status.value,
        "updated_at":subskill.updated_at
    }
