from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import get_add_teacher_uc, get_teacher_repo
from app.application.use_cases.school_management import AddTeacherUseCase
from app.infrastructure.repositories.sql_repos import SqlTeacherRepository

router = APIRouter(prefix="/schools/{school_id}/teachers", tags=["Teachers"])


class AddTeacherRequest(BaseModel):
    name: str
    subject_ids: list[UUID] = []


class TeacherResponse(BaseModel):
    id: UUID
    name: str
    school_id: UUID
    subject_ids: list[UUID]


@router.post("/", response_model=TeacherResponse, status_code=201)
async def add_teacher(
    school_id: UUID,
    body: AddTeacherRequest,
    uc: AddTeacherUseCase = Depends(get_add_teacher_uc),
):
    teacher = await uc.execute(school_id, body.name, body.subject_ids)
    return TeacherResponse(
        id=teacher.id, name=teacher.name,
        school_id=teacher.school_id, subject_ids=teacher.subject_ids,
    )


@router.get("/", response_model=list[TeacherResponse])
async def list_teachers(school_id: UUID, repo: SqlTeacherRepository = Depends(get_teacher_repo)):
    teachers = await repo.list(school_id)
    return [
        TeacherResponse(id=t.id, name=t.name, school_id=t.school_id, subject_ids=t.subject_ids)
        for t in teachers
    ]


@router.delete("/{teacher_id}", status_code=204)
async def delete_teacher(teacher_id: UUID, repo: SqlTeacherRepository = Depends(get_teacher_repo)):
    await repo.delete(teacher_id)
