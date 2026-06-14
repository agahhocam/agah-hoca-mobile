from sqlalchemy import (
    Column, String, Integer, Boolean, Float, ForeignKey, JSON, DateTime, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
import uuid
from datetime import datetime


class Base(DeclarativeBase):
    pass


class SchoolModel(Base):
    __tablename__ = "schools"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teachers = relationship("TeacherModel", back_populates="school", cascade="all, delete-orphan")
    subjects = relationship("SubjectModel", back_populates="school", cascade="all, delete-orphan")
    classes = relationship("ClassGroupModel", back_populates="school", cascade="all, delete-orphan")
    constraints = relationship("ConstraintModel", back_populates="school", cascade="all, delete-orphan")
    schedules = relationship("ScheduleModel", back_populates="school", cascade="all, delete-orphan")
    timeslots = relationship("TimeslotModel", back_populates="school", cascade="all, delete-orphan")


class SubjectModel(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)

    school = relationship("SchoolModel", back_populates="subjects")
    __table_args__ = (UniqueConstraint("school_id", "name"),)


teacher_subjects = __import__("sqlalchemy", fromlist=["Table"]).Table(
    "teacher_subjects",
    Base.metadata,
    __import__("sqlalchemy", fromlist=["Column"]).Column(
        "teacher_id", UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True
    ),
    __import__("sqlalchemy", fromlist=["Column"]).Column(
        "subject_id", UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True
    ),
)


class TeacherModel(Base):
    __tablename__ = "teachers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)

    school = relationship("SchoolModel", back_populates="teachers")
    subjects = relationship("SubjectModel", secondary=teacher_subjects)


class ClassGroupModel(Base):
    __tablename__ = "class_groups"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)

    school = relationship("SchoolModel", back_populates="classes")
    __table_args__ = (UniqueConstraint("school_id", "name"),)


class LessonRequirementModel(Base):
    __tablename__ = "lesson_requirements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("class_groups.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    weekly_hours = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("class_id", "subject_id"),)


class TimeslotModel(Base):
    __tablename__ = "timeslots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day = Column(Integer, nullable=False)       # 0–4
    period = Column(Integer, nullable=False)    # 1–N
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)

    school = relationship("SchoolModel", back_populates="timeslots")
    __table_args__ = (UniqueConstraint("school_id", "day", "period"),)


class ConstraintModel(Base):
    __tablename__ = "constraints"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    parameters = Column(JSON, default=dict)
    weight = Column(Integer, default=1)

    school = relationship("SchoolModel", back_populates="constraints")


class ScheduleModel(Base):
    __tablename__ = "schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    quality_score = Column(Float, default=0.0)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("SchoolModel", back_populates="schedules")
    entries = relationship("ScheduleEntryModel", back_populates="schedule", cascade="all, delete-orphan")


class ScheduleEntryModel(Base):
    __tablename__ = "schedule_entries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("class_groups.id"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    timeslot_id = Column(UUID(as_uuid=True), ForeignKey("timeslots.id"), nullable=False)

    schedule = relationship("ScheduleModel", back_populates="entries")
