# # from fastapi import APIRouter, Depends, HTTPException
# # from sqlalchemy.orm import Session
# # from sqlalchemy import and_
# # from typing import List
# # from datetime import datetime

# # from database import get_db
# # from models.user import User
# # from models.skill import Skill, SubSkill, SkillSubmission, SubSkillSubmission, SkillStatus
# # from schemas.skill import SkillSubmissionResponse, SkillApprovalRequest
# # from routes.auth import get_current_user

# # router = APIRouter(prefix="/approvals", tags=["approvals"])

# # @router.get("/pending", response_model=List[SkillSubmissionResponse])
# # async def get_pending_approvals(
# #     db: Session = Depends(get_db),
# #     current_user: User = Depends(get_current_user)
# # ):
# #     if not current_user.is_manager:
# #         raise HTTPException(status_code=403, detail="Only managers can view approvals")
    
# #     # Get pending submissions from subordinates
# #     pending_submissions = db.query(SkillSubmission).join(User).filter(
# #         and_(
# #             User.manager_id == current_user.id,
# #             SkillSubmission.status == SkillStatus.PENDING
# #         )
# #     ).all()
    
# #     return [SkillSubmissionResponse.from_orm(submission) for submission in pending_submissions]

# # @router.get("/all", response_model=List[SkillSubmissionResponse])
# # async def get_all_approvals(
# #     db: Session = Depends(get_db),
# #     current_user: User = Depends(get_current_user)
# # ):
# #     if not current_user.is_manager:
# #         raise HTTPException(status_code=403, detail="Only managers can view approvals")
    
# #     # Get all submissions from subordinates
# #     submissions = db.query(SkillSubmission).join(User).filter(
# #         User.manager_id == current_user.id
# #     ).all()
    
# #     return [SkillSubmissionResponse.from_orm(submission) for submission in submissions]

# # @router.post("/{submission_id}/approve")
# # async def approve_skill_submission(
# #     submission_id: int,
# #     approval_data: SkillApprovalRequest,
# #     db: Session = Depends(get_db),
# #     current_user: User = Depends(get_current_user)
# # ):
# #     if not current_user.is_manager:
# #         raise HTTPException(status_code=403, detail="Only managers can approve skills")
    
# #     # Get the submission
# #     submission = db.query(SkillSubmission).join(User).filter(
# #         and_(
# #             SkillSubmission.id == submission_id,
# #             User.manager_id == current_user.id,
# #             SkillSubmission.status == SkillStatus.PENDING
# #         )
# #     ).first()
    
# #     if not submission:
# #         raise HTTPException(status_code=404, detail="Submission not found or already processed")
    
# #     # Update submission status
# #     if approval_data.action == "approve":
# #         submission.status = SkillStatus.APPROVED
        
# #         # Create approved skill and sub-skills
# #         approved_skill = Skill(
# #             user_id=submission.user_id,
# #             skill_name=submission.skill_name,
# #             status=SkillStatus.APPROVED,
# #             manager_comments=approval_data.manager_comments
# #         )
# #         db.add(approved_skill)
# #         db.commit()
# #         db.refresh(approved_skill)
        
# #         # Create sub-skills
# #         for sub_submission in submission.sub_skill_submissions:
# #             proficiency = sub_submission.proficiency_level
            
# #             # Apply proficiency modifications if provided
# #             if (approval_data.proficiency_modifications and 
# #                 str(sub_submission.id) in approval_data.proficiency_modifications):
# #                 proficiency = approval_data.proficiency_modifications[str(sub_submission.id)]
            
# #             sub_skill = SubSkill(
# #                 skill_id=approved_skill.id,
# #                 sub_skill_name=sub_submission.sub_skill_name,
# #                 proficiency_level=proficiency,
# #                 experience_years=sub_submission.experience_years,
# #                 has_certification=sub_submission.has_certification,
# #                 certification_file_url=sub_submission.certification_file_url
# #             )
# #             db.add(sub_skill)
        
# #     elif approval_data.action == "reject":
# #         submission.status = SkillStatus.REJECTED
# #     else:
# #         raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
# #     # Update submission metadata
# #     submission.manager_comments = approval_data.manager_comments
# #     submission.reviewed_at = datetime.utcnow()
# #     submission.approved_by_id = current_user.id
    
# #     db.commit()
# #     db.refresh(submission)
    
# #     return {
# #         "message": f"Skill submission {approval_data.action}d successfully",
# #         "submission": SkillSubmissionResponse.from_orm(submission)
# #     }

# # @router.get("/{submission_id}", response_model=SkillSubmissionResponse)
# # async def get_skill_submission(
# #     submission_id: int,
# #     db: Session = Depends(get_db),
# #     current_user: User = Depends(get_current_user)
# # ):
# #     if not current_user.is_manager:
# #         raise HTTPException(status_code=403, detail="Only managers can view submissions")
    
# #     submission = db.query(SkillSubmission).join(User).filter(
# #         and_(
# #             SkillSubmission.id == submission_id,
# #             User.manager_id == current_user.id
# #         )
# #     ).first()
    
# #     if not submission:
# #         raise HTTPException(status_code=404, detail="Submission not found")
    
# #     return SkillSubmissionResponse.from_orm(submission)




# # @router.get("/")
# # async def get_approvals(
# #     manager_id: int,
# #     status: SkillStatus = Query(..., description="Filter by status: pending, approved, rejected"),
# #     db: AsyncSession = Depends(get_db)
# # ):
# #     # Query SubSkills with eager-loading for user + skill
# #     stmt = (
# #         select(SubSkill)
# #         .options(
# #             selectinload(SubSkill.user),   # eager load user
# #             selectinload(SubSkill.skill)   # eager load skill
# #         )
# #         .join(SubSkill.user)  # join to filter by manager
# #         .where(
# #             SubSkill.status == status,
# #             User.manager_id == manager_id
# #         )
# #     )

# #     result = await db.execute(stmt)
# #     subskills = result.scalars().all()

# #     # Build response
# #     results = []
# #     for sub in subskills:
# #         results.append({
# #             "id": sub.id,
# #             "sub_skill_name": sub.sub_skill_name,
# #             "employee_proficiency": sub.employee_proficiency,
# #             "experience_years": sub.experience_years,
# #             "has_certification": sub.has_certification,
# #             "certification_file_url": sub.certification_file_url,
# #             "created_at": sub.created_at,
# #             "status": sub.status.value,

# #             # Manager review fields
# #             "manager_proficiency": sub.manager_proficiency,
# #             "manager_comments": sub.manager_comments,
# #             "update_at":sub.last_updated_at,
# #             # Relations
# #             "employee": {
# #                 "id": sub.user.id,
# #                 "name": sub.user.name,
# #                 "email": sub.user.email,
# #                 "employee_id": sub.user.employee_id,
# #                 "designation": sub.user.designation,
# #                 "capability": sub.user.capability,
# #             },
# #             "skill": {
# #                 "id": sub.skill.id,
# #                 "skill_name": sub.skill.skill_name,
# #             }
# #         })

# #     return {f"{status.value}_approvals": results}


# #new code 

# from fastapi import APIRouter, Depends, HTTPException, Query, Body
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select
# from sqlalchemy.orm import selectinload
# from sqlalchemy import func
# from datetime import datetime

# from database import get_db
# from models.skill import EmployeeSkill, SkillStatus, SubSkill, EmployeeSkillHistory
# from models.user import Employee
# from routes.auth import get_current_user  # ✅ use JWT-based current_user

# router = APIRouter(prefix="/approvals", tags=["Approvals"])


# # -------------------- List Approvals --------------------
# @router.get("/")
# async def get_approvals(
#     status: SkillStatus = Query(..., description="Filter by status: PENDING, APPROVED, REJECTED"),
#     page: int = Query(1, ge=1),
#     limit: int = Query(10, ge=1, le=100),
#     employee_name: str | None = None,
#     skill_name: str | None = None,
#     subskill_name: str | None = None,
#     min_experience: int | None = None,
#     db: AsyncSession = Depends(get_db),
#     current_user: Employee = Depends(get_current_user)
# ):
#     if not current_user.is_approver:
#         raise HTTPException(status_code=403, detail="Only approvers can view approvals")

#     base_stmt = (
#         select(EmployeeSkill)
#         .options(
#             selectinload(EmployeeSkill.employee),
#             selectinload(EmployeeSkill.subskill).selectinload(SubSkill.master_skill)
#         )
#         .where(EmployeeSkill.status == status)
#     )

#     # 🔍 Apply filters
#     if employee_name:
#         base_stmt = base_stmt.join(EmployeeSkill.employee).where(Employee.name.ilike(f"%{employee_name}%"))
#     if skill_name:
#         base_stmt = base_stmt.join(EmployeeSkill.subskill).join(SubSkill.master_skill)\
#             .where(SubSkill.master_skill.has(SubSkill.master_skill.skill_name.ilike(f"%{skill_name}%")))
#     if subskill_name:
#         base_stmt = base_stmt.join(EmployeeSkill.subskill).where(SubSkill.subskill_name.ilike(f"%{subskill_name}%"))
#     if min_experience is not None:
#         base_stmt = base_stmt.where(EmployeeSkill.experience >= min_experience)

#     # 📊 Count total
#     total_stmt = select(func.count()).select_from(base_stmt.subquery())
#     total = (await db.execute(total_stmt)).scalar()

#     # 📑 Pagination
#     stmt = base_stmt.order_by(EmployeeSkill.emp_skill_id.desc()).offset((page - 1) * limit).limit(limit)
#     result = await db.execute(stmt)
#     records = result.scalars().all()

#     # 🔄 Response
#     return {
#         "records": [
#             {
#                 "emp_skill_id": r.emp_skill_id,
#                 "employee_id": r.employee_id,
#                 "subskill_id": r.subskill_id,
#                 "experience": r.experience,
#                 "proficiency": r.proficiency,
#                 "certification": r.certification,
#                 "status": r.status.value,
#                 "approver_id": r.approver_id,
#                 "manager_comments": r.manager_comments,
#                 "employee": {
#                     "id": r.employee.id,
#                     "name": r.employee.name,
#                     "email": r.employee.email,
#                     "employee_id": r.employee.emp_id,
#                     "designation": r.employee.designation,
#                     "capability": r.employee.capability,
#                 },
#                 "subskill": {
#                     "id": r.subskill.subskill_id,
#                     "name": r.subskill.subskill_name,
#                     "master_skill": r.subskill.master_skill.skill_name,
#                 },
#             }
#             for r in records
#         ],
#         "total": total,
#         "page": page,
#         "limit": limit,
#     }


# # -------------------- Approve / Reject --------------------
# @router.put("/{emp_skill_id}")
# async def update_approval(
#     emp_skill_id: int,
#     action: str = Body(..., embed=True, description="Action: approve or reject"),
#     proficiency: int | None = Body(None, embed=True),
#     comments: str | None = Body(None, embed=True),
#     db: AsyncSession = Depends(get_db),
#     current_user: Employee = Depends(get_current_user)
# ):
#     if not current_user.is_approver:
#         raise HTTPException(status_code=403, detail="Only approvers can approve/reject skills")

#     # Fetch skill
#     stmt = select(EmployeeSkill).where(EmployeeSkill.emp_skill_id == emp_skill_id)
#     result = await db.execute(stmt)
#     skill = result.scalar_one_or_none()

#     if not skill:
#         raise HTTPException(status_code=404, detail="Skill not found")
#     if skill.status != SkillStatus.PENDING:
#         raise HTTPException(status_code=400, detail="Only pending skills can be reviewed")

#     # Update skill
#     skill.status = SkillStatus.APPROVED if action == "approve" else SkillStatus.REJECTED
#     skill.manager_comments = comments
#     skill.approver_id = current_user.id
#     if proficiency is not None:
#         skill.proficiency = proficiency

#     # Add to history
#     history = EmployeeSkillHistory(
#         emp_skill_id=skill.emp_skill_id,
#         employee_id=skill.employee.id,
#         subskill_id=skill.subskill_id,
#         experience=skill.experience,
#         proficiency=skill.proficiency,
#         certification=skill.certification,
#         manager_proficiency=proficiency,
#         manager_comments=comments,
#         approval_status=skill.status,
#         approver_id=current_user.id,
#         updated_by=current_user.id,
#         created_at=datetime.utcnow(),
#     )
#     db.add(history)

#     await db.commit()
#     return {"emp_skill_id": emp_skill_id, "status": skill.status.value, "approver_id": current_user.id}
