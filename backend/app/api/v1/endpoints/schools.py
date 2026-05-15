from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import (
    get_create_school_uc, get_school_repo,
)
from app.application.use_cases.school_management import CreateSchoolUseCase
from app.infrastructure.repositories.sql_repos import SqlSchoolRepository

router = APIRouter(prefix="/schools", tags=["Schools"])


class CreateSchoolRequest(BaseModel):
    name: str
    days: int = 5
    periods_per_day: int = 8


class SchoolResponse(BaseModel):
    id: UUID
    name: str
    is_active: bool


@router.post("/", response_model=SchoolResponse, status_code=201)
async def create_school(
    body: CreateSchoolRequest,
    uc: CreateSchoolUseCase = Depends(get_create_school_uc),
):
    try:
        school = await uc.execute(body.name, body.days, body.periods_per_day)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return SchoolResponse(id=school.id, name=school.name, is_active=school.is_active)


@router.get("/", response_model=list[SchoolResponse])
async def list_schools(repo: SqlSchoolRepository = Depends(get_school_repo)):
    schools = await repo.list(school_id=None)
    return [SchoolResponse(id=s.id, name=s.name, is_active=s.is_active) for s in schools]


@router.get("/{school_id}", response_model=SchoolResponse)
async def get_school(school_id: UUID, repo: SqlSchoolRepository = Depends(get_school_repo)):
    school = await repo.get(school_id)
    if not school:
        raise HTTPException(status_code=404, detail="Okul bulunamadı.")
    return SchoolResponse(id=school.id, name=school.name, is_active=school.is_active)
