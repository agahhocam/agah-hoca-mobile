from uuid import UUID
from app.domain.entities.school import Schedule
from app.infrastructure.repositories.sql_repos import (
    SqlSchoolRepository, SqlTeacherRepository, SqlClassGroupRepository,
    SqlLessonRequirementRepository, SqlConstraintRepository,
    SqlTimeslotRepository, SqlScheduleRepository,
)
from app.solver.timetable_solver import SolverInput, SolverResult, solve
from app.solver.dynamic_reschedule import reschedule_for_absent_teacher
from app.solver.quality_scorer import compute_score


class GenerateScheduleUseCase:
    def __init__(
        self,
        school_repo: SqlSchoolRepository,
        teacher_repo: SqlTeacherRepository,
        class_repo: SqlClassGroupRepository,
        lesson_repo: SqlLessonRequirementRepository,
        constraint_repo: SqlConstraintRepository,
        timeslot_repo: SqlTimeslotRepository,
        schedule_repo: SqlScheduleRepository,
    ):
        self.school_repo = school_repo
        self.teacher_repo = teacher_repo
        self.class_repo = class_repo
        self.lesson_repo = lesson_repo
        self.constraint_repo = constraint_repo
        self.timeslot_repo = timeslot_repo
        self.schedule_repo = schedule_repo

    async def execute(self, school_id: UUID, time_limit_secs: int = 60) -> SolverResult:
        school = await self.school_repo.get(school_id)
        if not school:
            raise ValueError("Okul bulunamadı.")

        teachers = await self.teacher_repo.list(school_id)
        classes = await self.class_repo.list(school_id)
        requirements = await self.lesson_repo.list(school_id)
        constraints = await self.constraint_repo.list(school_id)
        timeslots = await self.timeslot_repo.list(school_id)

        inp = SolverInput(
            school_id=school_id, teachers=teachers, classes=classes,
            requirements=requirements, timeslots=timeslots,
            constraints=constraints, time_limit_secs=time_limit_secs,
        )
        result = solve(inp)

        if result.schedule:
            score = compute_score(result.schedule, timeslots)
            result.schedule.quality_score = score
            result.quality_score = score
            await self.schedule_repo.save(result.schedule)

        return result


class ReviseScheduleUseCase:
    def __init__(
        self,
        teacher_repo: SqlTeacherRepository,
        class_repo: SqlClassGroupRepository,
        lesson_repo: SqlLessonRequirementRepository,
        constraint_repo: SqlConstraintRepository,
        timeslot_repo: SqlTimeslotRepository,
        schedule_repo: SqlScheduleRepository,
    ):
        self.teacher_repo = teacher_repo
        self.class_repo = class_repo
        self.lesson_repo = lesson_repo
        self.constraint_repo = constraint_repo
        self.timeslot_repo = timeslot_repo
        self.schedule_repo = schedule_repo

    async def execute(
        self,
        school_id: UUID,
        absent_teacher_id: UUID,
        affected_timeslot_ids: list[UUID],
    ) -> SolverResult:
        current = await self.schedule_repo.get_latest(school_id)
        if not current:
            raise ValueError("Mevcut program bulunamadı. Önce program oluşturun.")

        teachers = await self.teacher_repo.list(school_id)
        classes = await self.class_repo.list(school_id)
        requirements = await self.lesson_repo.list(school_id)
        constraints = await self.constraint_repo.list(school_id)
        timeslots = await self.timeslot_repo.list(school_id)

        result = reschedule_for_absent_teacher(
            current_schedule=current,
            absent_teacher_id=absent_teacher_id,
            affected_timeslot_ids=affected_timeslot_ids,
            teachers=teachers,
            classes=classes,
            requirements=requirements,
            timeslots=timeslots,
            constraints=constraints,
        )

        if result.schedule:
            timeslots_for_score = timeslots
            score = compute_score(result.schedule, timeslots_for_score)
            result.schedule.quality_score = score
            result.quality_score = score
            await self.schedule_repo.save(result.schedule)

        return result


class ExportScheduleUseCase:
    def __init__(self, schedule_repo: SqlScheduleRepository, timeslot_repo: SqlTimeslotRepository):
        self.schedule_repo = schedule_repo
        self.timeslot_repo = timeslot_repo

    async def execute(self, school_id: UUID) -> dict:
        schedule = await self.schedule_repo.get_latest(school_id)
        if not schedule:
            raise ValueError("Program bulunamadı.")

        timeslots = await self.timeslot_repo.list(school_id)
        ts_map = {ts.id: ts for ts in timeslots}

        DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]
        grid: dict[str, dict[int, list]] = {d: {} for d in DAY_NAMES}

        for entry in schedule.entries:
            ts = ts_map[entry.timeslot_id]
            day_name = DAY_NAMES[ts.day]
            grid[day_name].setdefault(ts.period, []).append({
                "teacher_id": str(entry.teacher_id),
                "class_id": str(entry.class_id),
                "subject_id": str(entry.subject_id),
            })

        return {
            "schedule_id": str(schedule.id),
            "version": schedule.version,
            "quality_score": schedule.quality_score,
            "timetable": grid,
        }
