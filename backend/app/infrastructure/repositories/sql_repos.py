from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.entities.school import (
    School, Teacher, Subject, ClassGroup,
    LessonRequirement, Constraint, Schedule, ScheduleEntry, Timeslot,
)
from app.infrastructure.database.models import (
    SchoolModel, TeacherModel, SubjectModel, ClassGroupModel,
    LessonRequirementModel, ConstraintModel, ScheduleModel,
    ScheduleEntryModel, TimeslotModel,
)


def _school_from_model(m: SchoolModel) -> School:
    return School(id=m.id, name=m.name, is_active=m.is_active, created_at=m.created_at)


def _teacher_from_model(m: TeacherModel) -> Teacher:
    return Teacher(id=m.id, name=m.name, school_id=m.school_id,
                   subject_ids=[s.id for s in m.subjects])


def _subject_from_model(m: SubjectModel) -> Subject:
    return Subject(id=m.id, name=m.name, school_id=m.school_id)


def _class_from_model(m: ClassGroupModel) -> ClassGroup:
    return ClassGroup(id=m.id, name=m.name, school_id=m.school_id)


def _lesson_from_model(m: LessonRequirementModel) -> LessonRequirement:
    return LessonRequirement(
        id=m.id, class_id=m.class_id, subject_id=m.subject_id,
        teacher_id=m.teacher_id, weekly_hours=m.weekly_hours,
    )


def _timeslot_from_model(m: TimeslotModel) -> Timeslot:
    return Timeslot(id=m.id, day=m.day, period=m.period)


def _constraint_from_model(m: ConstraintModel) -> Constraint:
    return Constraint(
        id=m.id, type=m.type, school_id=m.school_id,
        target_id=m.target_id, parameters=m.parameters, weight=m.weight,
    )


def _schedule_from_model(m: ScheduleModel) -> Schedule:
    entries = [
        ScheduleEntry(
            teacher_id=e.teacher_id, class_id=e.class_id,
            subject_id=e.subject_id, timeslot_id=e.timeslot_id,
        )
        for e in m.entries
    ]
    return Schedule(
        id=m.id, school_id=m.school_id, entries=entries,
        quality_score=m.quality_score, version=m.version, created_at=m.created_at,
    )


class SqlSchoolRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> School | None:
        result = await self.db.get(SchoolModel, id)
        return _school_from_model(result) if result else None

    async def list(self, school_id: UUID = None) -> list[School]:
        stmt = select(SchoolModel)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_school_from_model(r) for r in rows]

    async def save(self, entity: School) -> School:
        existing = await self.db.get(SchoolModel, entity.id)
        if existing:
            existing.name = entity.name
            existing.is_active = entity.is_active
        else:
            self.db.add(SchoolModel(
                id=entity.id, name=entity.name,
                is_active=entity.is_active, created_at=entity.created_at,
            ))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(SchoolModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()

    async def get_by_name(self, name: str) -> School | None:
        stmt = select(SchoolModel).where(SchoolModel.name == name)
        result = (await self.db.execute(stmt)).scalar_one_or_none()
        return _school_from_model(result) if result else None


class SqlTeacherRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Teacher | None:
        from sqlalchemy.orm import selectinload
        stmt = select(TeacherModel).options(selectinload(TeacherModel.subjects)).where(TeacherModel.id == id)
        result = (await self.db.execute(stmt)).scalar_one_or_none()
        return _teacher_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[Teacher]:
        from sqlalchemy.orm import selectinload
        stmt = (select(TeacherModel)
                .options(selectinload(TeacherModel.subjects))
                .where(TeacherModel.school_id == school_id))
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_teacher_from_model(r) for r in rows]

    async def save(self, entity: Teacher) -> Teacher:
        existing = await self.db.get(TeacherModel, entity.id)
        if existing:
            existing.name = entity.name
        else:
            self.db.add(TeacherModel(id=entity.id, name=entity.name, school_id=entity.school_id))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(TeacherModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()


class SqlSubjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Subject | None:
        result = await self.db.get(SubjectModel, id)
        return _subject_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[Subject]:
        stmt = select(SubjectModel).where(SubjectModel.school_id == school_id)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_subject_from_model(r) for r in rows]

    async def save(self, entity: Subject) -> Subject:
        existing = await self.db.get(SubjectModel, entity.id)
        if existing:
            existing.name = entity.name
        else:
            self.db.add(SubjectModel(id=entity.id, name=entity.name, school_id=entity.school_id))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(SubjectModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()


class SqlClassGroupRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> ClassGroup | None:
        result = await self.db.get(ClassGroupModel, id)
        return _class_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[ClassGroup]:
        stmt = select(ClassGroupModel).where(ClassGroupModel.school_id == school_id)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_class_from_model(r) for r in rows]

    async def save(self, entity: ClassGroup) -> ClassGroup:
        existing = await self.db.get(ClassGroupModel, entity.id)
        if existing:
            existing.name = entity.name
        else:
            self.db.add(ClassGroupModel(id=entity.id, name=entity.name, school_id=entity.school_id))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(ClassGroupModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()


class SqlLessonRequirementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> LessonRequirement | None:
        result = await self.db.get(LessonRequirementModel, id)
        return _lesson_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[LessonRequirement]:
        stmt = (select(LessonRequirementModel)
                .join(ClassGroupModel, LessonRequirementModel.class_id == ClassGroupModel.id)
                .where(ClassGroupModel.school_id == school_id))
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_lesson_from_model(r) for r in rows]

    async def list_by_class(self, class_id: UUID) -> list[LessonRequirement]:
        stmt = select(LessonRequirementModel).where(LessonRequirementModel.class_id == class_id)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_lesson_from_model(r) for r in rows]

    async def save(self, entity: LessonRequirement) -> LessonRequirement:
        existing = await self.db.get(LessonRequirementModel, entity.id)
        if existing:
            existing.weekly_hours = entity.weekly_hours
        else:
            self.db.add(LessonRequirementModel(
                id=entity.id, class_id=entity.class_id, subject_id=entity.subject_id,
                teacher_id=entity.teacher_id, weekly_hours=entity.weekly_hours,
            ))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(LessonRequirementModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()


class SqlConstraintRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Constraint | None:
        result = await self.db.get(ConstraintModel, id)
        return _constraint_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[Constraint]:
        stmt = select(ConstraintModel).where(ConstraintModel.school_id == school_id)
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_constraint_from_model(r) for r in rows]

    async def save(self, entity: Constraint) -> Constraint:
        existing = await self.db.get(ConstraintModel, entity.id)
        if existing:
            existing.parameters = entity.parameters
            existing.weight = entity.weight
        else:
            self.db.add(ConstraintModel(
                id=entity.id, type=entity.type, school_id=entity.school_id,
                target_id=entity.target_id, parameters=entity.parameters, weight=entity.weight,
            ))
        await self.db.commit()
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(ConstraintModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()


class SqlTimeslotRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Timeslot | None:
        result = await self.db.get(TimeslotModel, id)
        return _timeslot_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[Timeslot]:
        stmt = (select(TimeslotModel)
                .where(TimeslotModel.school_id == school_id)
                .order_by(TimeslotModel.day, TimeslotModel.period))
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_timeslot_from_model(r) for r in rows]

    async def list_by_school(self, school_id: UUID) -> list[Timeslot]:
        return await self.list(school_id)

    async def save(self, entity: Timeslot) -> Timeslot:
        raise NotImplementedError("Use bulk_create_for_school instead")

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(TimeslotModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()

    async def bulk_create_for_school(self, school_id: UUID, days: int, periods: int) -> list[Timeslot]:
        for day in range(days):
            for period in range(1, periods + 1):
                self.db.add(TimeslotModel(day=day, period=period, school_id=school_id))
        await self.db.commit()
        return await self.list(school_id)


class SqlScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, id: UUID) -> Schedule | None:
        from sqlalchemy.orm import selectinload
        stmt = (select(ScheduleModel)
                .options(selectinload(ScheduleModel.entries))
                .where(ScheduleModel.id == id))
        result = (await self.db.execute(stmt)).scalar_one_or_none()
        return _schedule_from_model(result) if result else None

    async def list(self, school_id: UUID) -> list[Schedule]:
        from sqlalchemy.orm import selectinload
        stmt = (select(ScheduleModel)
                .options(selectinload(ScheduleModel.entries))
                .where(ScheduleModel.school_id == school_id)
                .order_by(ScheduleModel.version.desc()))
        rows = (await self.db.execute(stmt)).scalars().all()
        return [_schedule_from_model(r) for r in rows]

    async def list_versions(self, school_id: UUID) -> list[Schedule]:
        return await self.list(school_id)

    async def get_latest(self, school_id: UUID) -> Schedule | None:
        schedules = await self.list(school_id)
        return schedules[0] if schedules else None

    async def save(self, entity: Schedule) -> Schedule:
        latest = await self.get_latest(entity.school_id)
        version = (latest.version + 1) if latest and latest.id != entity.id else entity.version

        model = ScheduleModel(
            id=entity.id, school_id=entity.school_id,
            quality_score=entity.quality_score, version=version, created_at=entity.created_at,
        )
        self.db.add(model)
        await self.db.flush()

        for e in entity.entries:
            self.db.add(ScheduleEntryModel(
                schedule_id=entity.id, teacher_id=e.teacher_id,
                class_id=e.class_id, subject_id=e.subject_id, timeslot_id=e.timeslot_id,
            ))

        await self.db.commit()
        entity.version = version
        return entity

    async def delete(self, id: UUID) -> None:
        obj = await self.db.get(ScheduleModel, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
