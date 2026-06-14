"""Unit tests for the CP-SAT solver — no database required."""

import pytest
from uuid import uuid4
from app.domain.entities.school import (
    Teacher, ClassGroup, LessonRequirement, Timeslot, Constraint, Subject,
)
from app.solver.timetable_solver import SolverInput, solve
from app.solver.quality_scorer import compute_score


def make_school_data():
    school_id = uuid4()
    math = Subject(name="Matematik", school_id=school_id)
    turkish = Subject(name="Türkçe", school_id=school_id)

    t1 = Teacher(name="Ali Hoca", school_id=school_id, subject_ids=[math.id])
    t2 = Teacher(name="Ayşe Hoca", school_id=school_id, subject_ids=[turkish.id])

    c9a = ClassGroup(name="9-A", school_id=school_id)
    c9b = ClassGroup(name="9-B", school_id=school_id)

    # 5 days × 8 periods = 40 slots
    timeslots = [Timeslot(day=d, period=p) for d in range(5) for p in range(1, 9)]

    requirements = [
        LessonRequirement(class_id=c9a.id, subject_id=math.id, teacher_id=t1.id, weekly_hours=3),
        LessonRequirement(class_id=c9a.id, subject_id=turkish.id, teacher_id=t2.id, weekly_hours=4),
        LessonRequirement(class_id=c9b.id, subject_id=math.id, teacher_id=t1.id, weekly_hours=3),
        LessonRequirement(class_id=c9b.id, subject_id=turkish.id, teacher_id=t2.id, weekly_hours=4),
    ]

    return school_id, [t1, t2], [c9a, c9b], requirements, timeslots


def test_solver_finds_feasible_solution():
    school_id, teachers, classes, requirements, timeslots = make_school_data()
    inp = SolverInput(
        school_id=school_id, teachers=teachers, classes=classes,
        requirements=requirements, timeslots=timeslots, constraints=[], time_limit_secs=30,
    )
    result = solve(inp)
    assert result.status in ("OPTIMAL", "FEASIBLE")
    assert result.schedule is not None
    assert len(result.schedule.entries) == sum(r.weekly_hours for r in requirements)


def test_hard_constraint_no_double_booking():
    """Teacher must not appear in two classes at the same time."""
    school_id, teachers, classes, requirements, timeslots = make_school_data()
    inp = SolverInput(
        school_id=school_id, teachers=teachers, classes=classes,
        requirements=requirements, timeslots=timeslots, constraints=[], time_limit_secs=30,
    )
    result = solve(inp)
    assert result.schedule is not None

    from collections import defaultdict
    teacher_slots: dict = defaultdict(list)
    for e in result.schedule.entries:
        teacher_slots[(e.teacher_id, e.timeslot_id)].append(e)

    for key, entries in teacher_slots.items():
        assert len(entries) == 1, f"Double booking at {key}: {entries}"


def test_weekly_hours_satisfied():
    school_id, teachers, classes, requirements, timeslots = make_school_data()
    inp = SolverInput(
        school_id=school_id, teachers=teachers, classes=classes,
        requirements=requirements, timeslots=timeslots, constraints=[], time_limit_secs=30,
    )
    result = solve(inp)
    assert result.schedule is not None

    from collections import Counter
    counts: Counter = Counter()
    for e in result.schedule.entries:
        counts[(e.class_id, e.subject_id)] += 1

    for req in requirements:
        assert counts[(req.class_id, req.subject_id)] == req.weekly_hours


def test_infeasible_when_too_many_hours():
    """Solver must return INFEASIBLE when total hours exceed available slots."""
    school_id = uuid4()
    t = Teacher(name="Tek Hoca", school_id=school_id, subject_ids=[])
    c = ClassGroup(name="12-A", school_id=school_id)
    # Only 2 timeslots but 5 hours required
    timeslots = [Timeslot(day=0, period=1), Timeslot(day=0, period=2)]
    subject_id = uuid4()
    requirements = [LessonRequirement(class_id=c.id, subject_id=subject_id, teacher_id=t.id, weekly_hours=5)]

    inp = SolverInput(
        school_id=school_id, teachers=[t], classes=[c],
        requirements=requirements, timeslots=timeslots, constraints=[], time_limit_secs=10,
    )
    result = solve(inp)
    assert result.status == "INFEASIBLE"
    assert result.schedule is None


def test_quality_scorer_returns_0_to_100():
    school_id, teachers, classes, requirements, timeslots = make_school_data()
    inp = SolverInput(
        school_id=school_id, teachers=teachers, classes=classes,
        requirements=requirements, timeslots=timeslots, constraints=[], time_limit_secs=30,
    )
    result = solve(inp)
    assert result.schedule is not None
    score = compute_score(result.schedule, timeslots)
    assert 0.0 <= score <= 100.0


def test_soft_constraint_no_afternoon():
    """With no_afternoon soft constraint, fewer afternoon slots should be used (vs unconstrained)."""
    school_id, teachers, classes, requirements, timeslots = make_school_data()

    soft_c = Constraint(
        type="no_afternoon", school_id=school_id, target_id=None, parameters={}, weight=10
    )
    inp_constrained = SolverInput(
        school_id=school_id, teachers=teachers, classes=classes,
        requirements=requirements, timeslots=timeslots,
        constraints=[soft_c], time_limit_secs=30,
    )
    result = solve(inp_constrained)
    assert result.status in ("OPTIMAL", "FEASIBLE")

    # Count afternoon entries (period >= 5)
    ts_map = {ts.id: ts for ts in timeslots}
    afternoon_count = sum(
        1 for e in result.schedule.entries if ts_map[e.timeslot_id].period >= 5
    )
    total = len(result.schedule.entries)
    afternoon_ratio = afternoon_count / total if total else 0
    # With 5 days × 4 morning + 4 afternoon slots, soft constraint should keep afternoon below 50%
    assert afternoon_ratio <= 0.5, f"Too many afternoon slots ({afternoon_ratio:.0%})"
