"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "schools",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "subjects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("school_id", "name"),
    )

    op.create_table(
        "teachers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
    )

    op.create_table(
        "teacher_subjects",
        sa.Column("teacher_id", UUID(as_uuid=True), sa.ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("subject_id", UUID(as_uuid=True), sa.ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "class_groups",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("school_id", "name"),
    )

    op.create_table(
        "timeslots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("period", sa.Integer(), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("school_id", "day", "period"),
    )

    op.create_table(
        "lesson_requirements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("class_id", UUID(as_uuid=True), sa.ForeignKey("class_groups.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject_id", UUID(as_uuid=True), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("teacher_id", UUID(as_uuid=True), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("weekly_hours", sa.Integer(), nullable=False),
        sa.UniqueConstraint("class_id", "subject_id"),
    )

    op.create_table(
        "constraints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", UUID(as_uuid=True), nullable=True),
        sa.Column("parameters", JSON, default={}),
        sa.Column("weight", sa.Integer(), default=1),
    )

    op.create_table(
        "schedules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quality_score", sa.Float(), default=0.0),
        sa.Column("version", sa.Integer(), default=1),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "schedule_entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("schedule_id", UUID(as_uuid=True), sa.ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("teacher_id", UUID(as_uuid=True), sa.ForeignKey("teachers.id"), nullable=False),
        sa.Column("class_id", UUID(as_uuid=True), sa.ForeignKey("class_groups.id"), nullable=False),
        sa.Column("subject_id", UUID(as_uuid=True), sa.ForeignKey("subjects.id"), nullable=False),
        sa.Column("timeslot_id", UUID(as_uuid=True), sa.ForeignKey("timeslots.id"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("schedule_entries")
    op.drop_table("schedules")
    op.drop_table("constraints")
    op.drop_table("lesson_requirements")
    op.drop_table("timeslots")
    op.drop_table("class_groups")
    op.drop_table("teacher_subjects")
    op.drop_table("teachers")
    op.drop_table("subjects")
    op.drop_table("schools")
