from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.deps import get_add_class_uc, get_class_repo
from app.application.use_cases.school_management import AddClassUseCase
from app.infrastructure.repositories.sql_repos import SqlClassGroupRepository

router = APIRouter(prefix="/schools/{school_id}/classes", tags=["Classes"])


class AddClassRequest(BaseModel):
    name: str


class ClassResponse(BaseModel):
    id: UUID
    name: str
    school_id: UUID


@router.post("/", response_model=ClassResponse, status_code=201)
async def add_class(
    school_id: UUID,
    body: AddClassRequest,
    uc: AddClassUseCase = Depends(get_add_class_uc),
):
    cls = await uc.execute(school_id, body.name)
    return ClassResponse(id=cls.id, name=cls.name, school_id=cls.school_id)


@router.get("/", response_model=list[ClassResponse])
async def list_classes(school_id: UUID, repo: SqlClassGroupRepository = Depends(get_class_repo)):
    classes = await repo.list(school_id)
    return [ClassResponse(id=c.id, name=c.name, school_id=c.school_id) for c in classes]
