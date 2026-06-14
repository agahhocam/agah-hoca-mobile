from uuid import UUID
from app.domain.entities.school import School, Teacher, Subject, ClassGroup, LessonRequirement, Constraint
from app.infrastructure.repositories.sql_repos import (
    SqlSchoolRepository, SqlTeacherRepository, SqlSubjectRepository,
    SqlClassGroupRepository, SqlLessonRequirementRepository, SqlConstraintRepository,
    SqlTimeslotRepository,
)


class CreateSchoolUseCase:
    def __init__(self, repo: SqlSchoolRepository, timeslot_repo: SqlTimeslotRepository):
        self.repo = repo
        self.timeslot_repo = timeslot_repo

    async def execute(self, name: str, days: int = 5, periods_per_day: int = 8) -> School:
        existing = await self.repo.get_by_name(name)
        if existing:
            raise ValueError(f"'{name}' adında bir okul zaten mevcut.")
        school = School(name=name)
        await self.repo.save(school)
        await self.timeslot_repo.bulk_create_for_school(school.id, days, periods_per_day)
        return school


class AddTeacherUseCase:
    def __init__(self, teacher_repo: SqlTeacherRepository, subject_repo: SqlSubjectRepository):
        self.teacher_repo = teacher_repo
        self.subject_repo = subject_repo

    async def execute(self, school_id: UUID, name: str, subject_ids: list[UUID]) -> Teacher:
        teacher = Teacher(name=name, school_id=school_id, subject_ids=subject_ids)
        return await self.teacher_repo.save(teacher)


class AddSubjectUseCase:
    def __init__(self, repo: SqlSubjectRepository):
        self.repo = repo

    async def execute(self, school_id: UUID, name: str) -> Subject:
        subject = Subject(name=name, school_id=school_id)
        return await self.repo.save(subject)


class AddClassUseCase:
    def __init__(self, repo: SqlClassGroupRepository):
        self.repo = repo

    async def execute(self, school_id: UUID, name: str) -> ClassGroup:
        cls = ClassGroup(name=name, school_id=school_id)
        return await self.repo.save(cls)


class DefineLessonsUseCase:
    def __init__(self, repo: SqlLessonRequirementRepository):
        self.repo = repo

    async def execute(
        self, class_id: UUID, subject_id: UUID, teacher_id: UUID, weekly_hours: int
    ) -> LessonRequirement:
        if weekly_hours < 1:
            raise ValueError("Haftalık ders saati en az 1 olmalıdır.")
        req = LessonRequirement(
            class_id=class_id, subject_id=subject_id,
            teacher_id=teacher_id, weekly_hours=weekly_hours,
        )
        return await self.repo.save(req)


class DefineConstraintUseCase:
    def __init__(self, repo: SqlConstraintRepository):
        self.repo = repo

    VALID_TYPES = {
        "teacher_unavailable", "class_unavailable",
        "no_afternoon", "no_first_period",
        "consecutive_preferred", "day_preference",
    }

    async def execute(
        self, school_id: UUID, ctype: str, target_id: UUID | None,
        parameters: dict, weight: int
    ) -> Constraint:
        if ctype not in self.VALID_TYPES:
            raise ValueError(f"Bilinmeyen kısıt türü: {ctype}. Geçerliler: {self.VALID_TYPES}")
        c = Constraint(type=ctype, school_id=school_id, target_id=target_id,
                       parameters=parameters, weight=weight)
        return await self.repo.save(c)
