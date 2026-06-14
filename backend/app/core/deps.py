from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories.sql_repos import (
    SqlSchoolRepository, SqlTeacherRepository, SqlSubjectRepository,
    SqlClassGroupRepository, SqlLessonRequirementRepository,
    SqlConstraintRepository, SqlTimeslotRepository, SqlScheduleRepository,
)
from app.application.use_cases.school_management import (
    CreateSchoolUseCase, AddTeacherUseCase, AddSubjectUseCase,
    AddClassUseCase, DefineLessonsUseCase, DefineConstraintUseCase,
)
from app.application.use_cases.schedule_management import (
    GenerateScheduleUseCase, ReviseScheduleUseCase, ExportScheduleUseCase,
)


def get_school_repo(db: AsyncSession = Depends(get_db)) -> SqlSchoolRepository:
    return SqlSchoolRepository(db)


def get_teacher_repo(db: AsyncSession = Depends(get_db)) -> SqlTeacherRepository:
    return SqlTeacherRepository(db)


def get_subject_repo(db: AsyncSession = Depends(get_db)) -> SqlSubjectRepository:
    return SqlSubjectRepository(db)


def get_class_repo(db: AsyncSession = Depends(get_db)) -> SqlClassGroupRepository:
    return SqlClassGroupRepository(db)


def get_lesson_repo(db: AsyncSession = Depends(get_db)) -> SqlLessonRequirementRepository:
    return SqlLessonRequirementRepository(db)


def get_constraint_repo(db: AsyncSession = Depends(get_db)) -> SqlConstraintRepository:
    return SqlConstraintRepository(db)


def get_timeslot_repo(db: AsyncSession = Depends(get_db)) -> SqlTimeslotRepository:
    return SqlTimeslotRepository(db)


def get_schedule_repo(db: AsyncSession = Depends(get_db)) -> SqlScheduleRepository:
    return SqlScheduleRepository(db)


def get_create_school_uc(
    school_repo=Depends(get_school_repo),
    timeslot_repo=Depends(get_timeslot_repo),
) -> CreateSchoolUseCase:
    return CreateSchoolUseCase(school_repo, timeslot_repo)


def get_add_teacher_uc(
    teacher_repo=Depends(get_teacher_repo),
    subject_repo=Depends(get_subject_repo),
) -> AddTeacherUseCase:
    return AddTeacherUseCase(teacher_repo, subject_repo)


def get_add_subject_uc(subject_repo=Depends(get_subject_repo)) -> AddSubjectUseCase:
    return AddSubjectUseCase(subject_repo)


def get_add_class_uc(class_repo=Depends(get_class_repo)) -> AddClassUseCase:
    return AddClassUseCase(class_repo)


def get_define_lessons_uc(lesson_repo=Depends(get_lesson_repo)) -> DefineLessonsUseCase:
    return DefineLessonsUseCase(lesson_repo)


def get_define_constraint_uc(constraint_repo=Depends(get_constraint_repo)) -> DefineConstraintUseCase:
    return DefineConstraintUseCase(constraint_repo)


def get_generate_schedule_uc(
    school_repo=Depends(get_school_repo),
    teacher_repo=Depends(get_teacher_repo),
    class_repo=Depends(get_class_repo),
    lesson_repo=Depends(get_lesson_repo),
    constraint_repo=Depends(get_constraint_repo),
    timeslot_repo=Depends(get_timeslot_repo),
    schedule_repo=Depends(get_schedule_repo),
) -> GenerateScheduleUseCase:
    return GenerateScheduleUseCase(
        school_repo, teacher_repo, class_repo, lesson_repo,
        constraint_repo, timeslot_repo, schedule_repo,
    )


def get_revise_schedule_uc(
    teacher_repo=Depends(get_teacher_repo),
    class_repo=Depends(get_class_repo),
    lesson_repo=Depends(get_lesson_repo),
    constraint_repo=Depends(get_constraint_repo),
    timeslot_repo=Depends(get_timeslot_repo),
    schedule_repo=Depends(get_schedule_repo),
) -> ReviseScheduleUseCase:
    return ReviseScheduleUseCase(
        teacher_repo, class_repo, lesson_repo,
        constraint_repo, timeslot_repo, schedule_repo,
    )


def get_export_schedule_uc(
    schedule_repo=Depends(get_schedule_repo),
    timeslot_repo=Depends(get_timeslot_repo),
) -> ExportScheduleUseCase:
    return ExportScheduleUseCase(schedule_repo, timeslot_repo)
