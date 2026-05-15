from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.deps import get_add_subject_uc, get_subject_repo
from app.application.use_cases.school_management import AddSubjectUseCase
from app.infrastructure.repositories.sql_repos import SqlSubjectRepository

router = APIRouter(prefix="/schools/{school_id}/subjects", tags=["Subjects"])


class AddSubjectRequest(BaseModel):
    name: str


class SubjectResponse(BaseModel):
    id: UUID
    name: str
    school_id: UUID


@router.post("/", response_model=SubjectResponse, status_code=201)
async def add_subject(
    school_id: UUID,
    body: AddSubjectRequest,
    uc: AddSubjectUseCase = Depends(get_add_subject_uc),
):
    subject = await uc.execute(school_id, body.name)
    return SubjectResponse(id=subject.id, name=subject.name, school_id=subject.school_id)


@router.get("/", response_model=list[SubjectResponse])
async def list_subjects(school_id: UUID, repo: SqlSubjectRepository = Depends(get_subject_repo)):
    subjects = await repo.list(school_id)
    return [SubjectResponse(id=s.id, name=s.name, school_id=s.school_id) for s in subjects]
