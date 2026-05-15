from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime


@dataclass
class School:
    name: str
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True


@dataclass
class Subject:
    name: str
    school_id: UUID
    id: UUID = field(default_factory=uuid4)


@dataclass
class Teacher:
    name: str
    school_id: UUID
    subject_ids: list[UUID] = field(default_factory=list)
    id: UUID = field(default_factory=uuid4)


@dataclass
class ClassGroup:
    name: str
    school_id: UUID
    id: UUID = field(default_factory=uuid4)


@dataclass
class LessonRequirement:
    class_id: UUID
    subject_id: UUID
    teacher_id: UUID
    weekly_hours: int
    id: UUID = field(default_factory=uuid4)


@dataclass
class Timeslot:
    day: int        # 0=Monday … 4=Friday
    period: int     # 1-based period index
    id: UUID = field(default_factory=uuid4)

    @property
    def day_name(self) -> str:
        return ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"][self.day]


@dataclass
class Constraint:
    type: str       # e.g. "teacher_unavailable", "no_afternoon", "consecutive_preferred"
    school_id: UUID
    target_id: UUID | None  # teacher/class being constrained
    parameters: dict = field(default_factory=dict)
    weight: int = 1  # 0 = hard, >0 = soft preference score
    id: UUID = field(default_factory=uuid4)


@dataclass
class ScheduleEntry:
    teacher_id: UUID
    class_id: UUID
    subject_id: UUID
    timeslot_id: UUID


@dataclass
class Schedule:
    school_id: UUID
    entries: list[ScheduleEntry] = field(default_factory=list)
    quality_score: float = 0.0
    version: int = 1
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
