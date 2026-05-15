from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.deps import get_define_constraint_uc, get_constraint_repo
from app.application.use_cases.school_management import DefineConstraintUseCase
from app.infrastructure.repositories.sql_repos import SqlConstraintRepository

router = APIRouter(prefix="/schools/{school_id}/constraints", tags=["Constraints"])

CONSTRAINT_TYPES = [
    "teacher_unavailable",
    "class_unavailable",
    "no_afternoon",
    "no_first_period",
    "consecutive_preferred",
    "day_preference",
]


class DefineConstraintRequest(BaseModel):
    type: str
    target_id: UUID | None = None
    parameters: dict = {}
    weight: int = 1   # 0 = hard constraint, >0 = soft


class ConstraintResponse(BaseModel):
    id: UUID
    type: str
    target_id: UUID | None
    parameters: dict
    weight: int


@router.post("/", response_model=ConstraintResponse, status_code=201)
async def define_constraint(
    school_id: UUID,
    body: DefineConstraintRequest,
    uc: DefineConstraintUseCase = Depends(get_define_constraint_uc),
):
    try:
        c = await uc.execute(school_id, body.type, body.target_id, body.parameters, body.weight)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ConstraintResponse(
        id=c.id, type=c.type, target_id=c.target_id,
        parameters=c.parameters, weight=c.weight,
    )


@router.get("/", response_model=list[ConstraintResponse])
async def list_constraints(
    school_id: UUID,
    repo: SqlConstraintRepository = Depends(get_constraint_repo),
):
    constraints = await repo.list(school_id)
    return [
        ConstraintResponse(
            id=c.id, type=c.type, target_id=c.target_id,
            parameters=c.parameters, weight=c.weight,
        )
        for c in constraints
    ]


@router.delete("/{constraint_id}", status_code=204)
async def delete_constraint(
    school_id: UUID,
    constraint_id: UUID,
    repo: SqlConstraintRepository = Depends(get_constraint_repo),
):
    await repo.delete(constraint_id)


@router.get("/types", tags=["Constraints"])
async def list_constraint_types():
    return {"types": CONSTRAINT_TYPES}
