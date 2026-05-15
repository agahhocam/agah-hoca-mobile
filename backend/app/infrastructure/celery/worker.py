"""
Celery worker for async schedule generation.

Usage:
    celery -A app.infrastructure.celery.worker worker --loglevel=info
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery("adpys", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Europe/Istanbul"


@celery_app.task(name="generate_schedule_async", bind=True, max_retries=2)
def generate_schedule_async(self, school_id: str, time_limit_secs: int = 120):
    """
    Offloaded schedule generation for large schools.
    Returns the solver result dict which the API can poll via task ID.
    """
    import asyncio
    from uuid import UUID
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from app.infrastructure.repositories.sql_repos import (
        SqlSchoolRepository, SqlTeacherRepository, SqlClassGroupRepository,
        SqlLessonRequirementRepository, SqlConstraintRepository,
        SqlTimeslotRepository, SqlScheduleRepository,
    )
    from app.application.use_cases.schedule_management import GenerateScheduleUseCase

    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def _run():
        async with Session() as db:
            uc = GenerateScheduleUseCase(
                school_repo=SqlSchoolRepository(db),
                teacher_repo=SqlTeacherRepository(db),
                class_repo=SqlClassGroupRepository(db),
                lesson_repo=SqlLessonRequirementRepository(db),
                constraint_repo=SqlConstraintRepository(db),
                timeslot_repo=SqlTimeslotRepository(db),
                schedule_repo=SqlScheduleRepository(db),
            )
            return await uc.execute(UUID(school_id), time_limit_secs)

    result = asyncio.run(_run())
    return {
        "status": result.status,
        "quality_score": result.quality_score,
        "schedule_id": str(result.schedule.id) if result.schedule else None,
        "conflict_explanation": result.conflict_explanation,
    }
