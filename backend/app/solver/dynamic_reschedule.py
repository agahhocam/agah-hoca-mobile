"""
Dynamic rescheduling: when a teacher is absent, only re-solve the affected lessons,
preserving the rest of the schedule unchanged (minimum-disruption principle).
"""

from __future__ import annotations
from uuid import UUID

from app.domain.entities.school import Schedule, ScheduleEntry, Timeslot
from app.solver.timetable_solver import SolverInput, SolverResult, solve
from app.domain.entities.school import Teacher, ClassGroup, LessonRequirement, Constraint


def reschedule_for_absent_teacher(
    current_schedule: Schedule,
    absent_teacher_id: UUID,
    affected_timeslot_ids: list[UUID],
    teachers: list[Teacher],
    classes: list[ClassGroup],
    requirements: list[LessonRequirement],
    timeslots: list[Timeslot],
    constraints: list[Constraint],
) -> SolverResult:
    """
    Re-solve only the lessons originally assigned to `absent_teacher_id`
    during `affected_timeslot_ids`.  All other entries are locked.
    """
    affected_set = set(affected_timeslot_ids)

    # Split entries: locked vs. must-reschedule
    locked_entries: list[ScheduleEntry] = []
    reschedule_entries: list[ScheduleEntry] = []
    for entry in current_schedule.entries:
        if entry.teacher_id == absent_teacher_id and entry.timeslot_id in affected_set:
            reschedule_entries.append(entry)
        else:
            locked_entries.append(entry)

    if not reschedule_entries:
        return SolverResult(
            schedule=current_schedule, status="FEASIBLE",
            quality_score=current_schedule.quality_score,
            conflict_explanation="Etkilenen ders bulunamadı.",
        )

    # Derive which (class, subject, teacher) tuples need re-assignment
    needed_reqs = []
    for e in reschedule_entries:
        matching = [r for r in requirements
                    if r.class_id == e.class_id and r.subject_id == e.subject_id]
        if matching:
            # Temporarily set weekly_hours to 1 (one slot to place)
            import copy
            req_copy = copy.copy(matching[0])
            req_copy.weekly_hours = 1
            # Find a substitute teacher who teaches this subject
            sub_teacher = _find_substitute(
                e.subject_id, absent_teacher_id, teachers, requirements
            )
            if sub_teacher:
                req_copy.teacher_id = sub_teacher.id
            needed_reqs.append(req_copy)

    # Remove locked timeslots from available pool
    locked_ts_ids = {e.timeslot_id for e in locked_entries}
    available_ts = [ts for ts in timeslots if ts.id not in locked_ts_ids]

    # Mark locked teacher slots as unavailable for substitute
    locked_teacher_slots: dict[UUID, set[UUID]] = {}
    for e in locked_entries:
        locked_teacher_slots.setdefault(e.teacher_id, set()).add(e.timeslot_id)

    extra_constraints = list(constraints)
    for teacher_id, ts_ids in locked_teacher_slots.items():
        extra_constraints.append(Constraint(
            type="teacher_unavailable",
            school_id=current_schedule.school_id,
            target_id=teacher_id,
            parameters={"timeslot_ids": [str(ts_id) for ts_id in ts_ids]},
            weight=0,
        ))

    sub_input = SolverInput(
        school_id=current_schedule.school_id,
        teachers=teachers,
        classes=classes,
        requirements=needed_reqs,
        timeslots=available_ts,
        constraints=extra_constraints,
        time_limit_secs=30,
    )

    result = solve(sub_input)

    if result.schedule:
        result.schedule.entries = locked_entries + result.schedule.entries
        result.schedule.id = current_schedule.id  # keep same schedule id

    return result


def _find_substitute(
    subject_id: UUID, absent_teacher_id: UUID,
    teachers: list[Teacher], requirements: list[LessonRequirement],
) -> Teacher | None:
    for t in teachers:
        if t.id == absent_teacher_id:
            continue
        if subject_id in t.subject_ids:
            return t
    return None
