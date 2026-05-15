from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.core.deps import (
    get_generate_schedule_uc, get_revise_schedule_uc, get_export_schedule_uc,
    get_schedule_repo,
)
from app.application.use_cases.schedule_management import (
    GenerateScheduleUseCase, ReviseScheduleUseCase, ExportScheduleUseCase,
)
from app.infrastructure.repositories.sql_repos import SqlScheduleRepository

router = APIRouter(prefix="/schools/{school_id}/schedules", tags=["Schedules"])


class GenerateRequest(BaseModel):
    time_limit_secs: int = 60


class ReviseRequest(BaseModel):
    absent_teacher_id: UUID
    affected_timeslot_ids: list[UUID]


class SolverResultResponse(BaseModel):
    status: str
    quality_score: float
    schedule_id: str | None = None
    version: int | None = None
    conflict_explanation: str = ""


class ScheduleSummary(BaseModel):
    id: UUID
    version: int
    quality_score: float
    created_at: str


@router.post("/generate", response_model=SolverResultResponse, status_code=201)
async def generate_schedule(
    school_id: UUID,
    body: GenerateRequest,
    uc: GenerateScheduleUseCase = Depends(get_generate_schedule_uc),
):
    result = await uc.execute(school_id, body.time_limit_secs)
    return SolverResultResponse(
        status=result.status,
        quality_score=result.quality_score,
        schedule_id=str(result.schedule.id) if result.schedule else None,
        version=result.schedule.version if result.schedule else None,
        conflict_explanation=result.conflict_explanation,
    )


@router.post("/revise", response_model=SolverResultResponse)
async def revise_schedule(
    school_id: UUID,
    body: ReviseRequest,
    uc: ReviseScheduleUseCase = Depends(get_revise_schedule_uc),
):
    try:
        result = await uc.execute(school_id, body.absent_teacher_id, body.affected_timeslot_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return SolverResultResponse(
        status=result.status,
        quality_score=result.quality_score,
        schedule_id=str(result.schedule.id) if result.schedule else None,
        version=result.schedule.version if result.schedule else None,
        conflict_explanation=result.conflict_explanation,
    )


@router.get("/export")
async def export_schedule(
    school_id: UUID,
    uc: ExportScheduleUseCase = Depends(get_export_schedule_uc),
):
    try:
        return await uc.execute(school_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=list[ScheduleSummary])
async def list_schedules(
    school_id: UUID,
    repo: SqlScheduleRepository = Depends(get_schedule_repo),
):
    schedules = await repo.list(school_id)
    return [
        ScheduleSummary(
            id=s.id, version=s.version,
            quality_score=s.quality_score,
            created_at=s.created_at.isoformat(),
        )
        for s in schedules
    ]
