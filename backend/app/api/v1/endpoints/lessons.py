from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import get_define_lessons_uc, get_lesson_repo
from app.application.use_cases.school_management import DefineLessonsUseCase
from app.infrastructure.repositories.sql_repos import SqlLessonRequirementRepository

router = APIRouter(prefix="/schools/{school_id}/lessons", tags=["Lessons"])


class DefineLessonRequest(BaseModel):
    class_id: UUID
    subject_id: UUID
    teacher_id: UUID
    weekly_hours: int


class LessonResponse(BaseModel):
    id: UUID
    class_id: UUID
    subject_id: UUID
    teacher_id: UUID
    weekly_hours: int


@router.post("/", response_model=LessonResponse, status_code=201)
async def define_lesson(
    school_id: UUID,
    body: DefineLessonRequest,
    uc: DefineLessonsUseCase = Depends(get_define_lessons_uc),
):
    try:
        req = await uc.execute(body.class_id, body.subject_id, body.teacher_id, body.weekly_hours)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return LessonResponse(
        id=req.id, class_id=req.class_id, subject_id=req.subject_id,
        teacher_id=req.teacher_id, weekly_hours=req.weekly_hours,
    )


@router.get("/", response_model=list[LessonResponse])
async def list_lessons(
    school_id: UUID,
    repo: SqlLessonRequirementRepository = Depends(get_lesson_repo),
):
    reqs = await repo.list(school_id)
    return [
        LessonResponse(
            id=r.id, class_id=r.class_id, subject_id=r.subject_id,
            teacher_id=r.teacher_id, weekly_hours=r.weekly_hours,
        )
        for r in reqs
    ]
