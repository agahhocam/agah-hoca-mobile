from abc import abstractmethod
from uuid import UUID
from .base import Repository
from ..entities.school import (
    School, Teacher, Subject, ClassGroup,
    LessonRequirement, Constraint, Schedule, Timeslot,
)


class SchoolRepository(Repository[School]):
    @abstractmethod
    async def get_by_name(self, name: str) -> School | None: ...


class TeacherRepository(Repository[Teacher]):
    pass


class SubjectRepository(Repository[Subject]):
    pass


class ClassGroupRepository(Repository[ClassGroup]):
    pass


class LessonRequirementRepository(Repository[LessonRequirement]):
    @abstractmethod
    async def list_by_class(self, class_id: UUID) -> list[LessonRequirement]: ...


class ConstraintRepository(Repository[Constraint]):
    pass


class TimeslotRepository(Repository[Timeslot]):
    @abstractmethod
    async def list_by_school(self, school_id: UUID) -> list[Timeslot]: ...


class ScheduleRepository(Repository[Schedule]):
    @abstractmethod
    async def get_latest(self, school_id: UUID) -> Schedule | None: ...

    @abstractmethod
    async def list_versions(self, school_id: UUID) -> list[Schedule]: ...
