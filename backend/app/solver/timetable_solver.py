"""
CP-SAT based timetable solver.

Decision variable:
    assign[(teacher_id, class_id, subject_id, timeslot_id)] ∈ {0, 1}

Hard constraints:
    - Teacher cannot be in two places at once
    - Class cannot have two lessons at once
    - Weekly hour requirements must be satisfied exactly

Soft constraints (weighted penalties added to objective):
    - no_afternoon: prefer teacher/class has no afternoon lessons
    - no_first_period: prefer first period free
    - consecutive: prefer back-to-back lessons for same class+subject
    - day_preference: prefer specific days
"""

from __future__ import annotations
from dataclasses import dataclass
from uuid import UUID
from ortools.sat.python import cp_model

from app.domain.entities.school import (
    Teacher, ClassGroup, LessonRequirement, Constraint, Schedule,
    ScheduleEntry, Timeslot,
)


AFTERNOON_START_PERIOD = 5  # periods >= 5 are considered afternoon


@dataclass
class SolverInput:
    school_id: UUID
    teachers: list[Teacher]
    classes: list[ClassGroup]
    requirements: list[LessonRequirement]
    timeslots: list[Timeslot]
    constraints: list[Constraint]
    time_limit_secs: int = 60


@dataclass
class SolverResult:
    schedule: Schedule | None
    status: str          # "OPTIMAL", "FEASIBLE", "INFEASIBLE", "UNKNOWN"
    quality_score: float
    conflict_explanation: str = ""


def solve(inp: SolverInput) -> SolverResult:
    model = cp_model.CpModel()

    teacher_map = {t.id: t for t in inp.teachers}
    class_map = {c.id: c for c in inp.classes}
    timeslot_map = {ts.id: ts for ts in inp.timeslots}

    reqs_by_teacher: dict[UUID, list[LessonRequirement]] = {}
    reqs_by_class: dict[UUID, list[LessonRequirement]] = {}
    for r in inp.requirements:
        reqs_by_teacher.setdefault(r.teacher_id, []).append(r)
        reqs_by_class.setdefault(r.class_id, []).append(r)

    # Build (requirement, timeslot) decision variables
    assign: dict[tuple, cp_model.IntVar] = {}
    for req in inp.requirements:
        for ts in inp.timeslots:
            key = (req.teacher_id, req.class_id, req.subject_id, ts.id)
            assign[key] = model.new_bool_var(
                f"assign_t{req.teacher_id}_c{req.class_id}_s{req.subject_id}_ts{ts.id}"
            )

    # --- Hard Constraint 1: weekly hours satisfied exactly ---
    for req in inp.requirements:
        slots_for_req = [
            assign[(req.teacher_id, req.class_id, req.subject_id, ts.id)]
            for ts in inp.timeslots
        ]
        model.add(sum(slots_for_req) == req.weekly_hours)

    # --- Hard Constraint 2: teacher at most one class per timeslot ---
    for teacher in inp.teachers:
        reqs_for_teacher = reqs_by_teacher.get(teacher.id, [])
        for ts in inp.timeslots:
            slots = [
                assign[(r.teacher_id, r.class_id, r.subject_id, ts.id)]
                for r in reqs_for_teacher
            ]
            if slots:
                model.add(sum(slots) <= 1)

    # --- Hard Constraint 3: class at most one lesson per timeslot ---
    for cls in inp.classes:
        reqs_for_class = reqs_by_class.get(cls.id, [])
        for ts in inp.timeslots:
            slots = [
                assign[(r.teacher_id, r.class_id, r.subject_id, ts.id)]
                for r in reqs_for_class
            ]
            if slots:
                model.add(sum(slots) <= 1)

    # --- Hard Constraint 4: teacher unavailable slots ---
    hard_unavailable = _parse_unavailable_constraints(inp.constraints, "teacher_unavailable")
    for (target_id, ts_id), _ in hard_unavailable.items():
        reqs = reqs_by_teacher.get(target_id, [])
        for r in reqs:
            key = (r.teacher_id, r.class_id, r.subject_id, ts_id)
            if key in assign:
                model.add(assign[key] == 0)

    class_unavailable = _parse_unavailable_constraints(inp.constraints, "class_unavailable")
    for (target_id, ts_id), _ in class_unavailable.items():
        reqs = reqs_by_class.get(target_id, [])
        for r in reqs:
            key = (r.teacher_id, r.class_id, r.subject_id, ts_id)
            if key in assign:
                model.add(assign[key] == 0)

    # --- Soft Constraints (objective penalties) ---
    penalty_terms: list[tuple[cp_model.IntVar, int]] = []

    soft_constraints: dict[str, list[Constraint]] = {}
    for c in inp.constraints:
        if c.weight > 0:
            soft_constraints.setdefault(c.type, []).append(c)

    # no_afternoon: penalise each assignment in period >= AFTERNOON_START_PERIOD
    for c in soft_constraints.get("no_afternoon", []):
        for (t_id, c_id, s_id, ts_id), var in assign.items():
            ts = timeslot_map[ts_id]
            if ts.period >= AFTERNOON_START_PERIOD:
                if c.target_id is None or c.target_id in (t_id, c_id):
                    penalty_terms.append((var, c.weight))

    # no_first_period: penalise period == 1
    for c in soft_constraints.get("no_first_period", []):
        for (t_id, c_id, s_id, ts_id), var in assign.items():
            ts = timeslot_map[ts_id]
            if ts.period == 1:
                if c.target_id is None or c.target_id in (t_id, c_id):
                    penalty_terms.append((var, c.weight))

    # day_preference: penalise assignments on days outside the preferred set
    for c in soft_constraints.get("day_preference", []):
        preferred_days = set(c.parameters.get("days", []))
        if not preferred_days:
            continue
        for (t_id, c_id, s_id, ts_id), var in assign.items():
            ts = timeslot_map[ts_id]
            if ts.day not in preferred_days:
                if c.target_id is None or c.target_id in (t_id, c_id):
                    penalty_terms.append((var, c.weight))

    # consecutive: reward consecutive lessons for same class+subject on same day
    # implemented as a bonus (subtract from penalty objective)
    consecutive_bonus: list[tuple[cp_model.IntVar, int]] = []
    consecutive_constraints = soft_constraints.get("consecutive_preferred", [])
    if consecutive_constraints:
        by_day: dict[int, list[Timeslot]] = {}
        for ts in inp.timeslots:
            by_day.setdefault(ts.day, []).append(ts)
        for day_slots in by_day.values():
            day_slots.sort(key=lambda x: x.period)

        for c in consecutive_constraints:
            for req in inp.requirements:
                if c.target_id is not None and c.target_id not in (req.teacher_id, req.class_id):
                    continue
                for day_slots in by_day.values():
                    for i in range(len(day_slots) - 1):
                        ts_a, ts_b = day_slots[i], day_slots[i + 1]
                        if ts_b.period == ts_a.period + 1:
                            ka = (req.teacher_id, req.class_id, req.subject_id, ts_a.id)
                            kb = (req.teacher_id, req.class_id, req.subject_id, ts_b.id)
                            if ka in assign and kb in assign:
                                both = model.new_bool_var(f"consec_{ka}_{kb}")
                                model.add_bool_and([assign[ka], assign[kb]]).only_enforce_if(both)
                                consecutive_bonus.append((both, c.weight))

    # Objective: minimise penalty - bonus
    total_penalty = sum(w * var for var, w in penalty_terms)
    total_bonus = sum(w * var for var, w in consecutive_bonus)
    model.minimize(total_penalty - total_bonus)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = inp.time_limit_secs
    status = solver.solve(model)

    status_name = solver.status_name(status)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        entries = []
        for (t_id, c_id, s_id, ts_id), var in assign.items():
            if solver.value(var):
                entries.append(ScheduleEntry(
                    teacher_id=t_id, class_id=c_id,
                    subject_id=s_id, timeslot_id=ts_id,
                ))

        obj = solver.objective_value
        max_penalty = max(1, len(penalty_terms) * 10)
        quality = max(0.0, min(100.0, 100.0 * (1 - obj / max_penalty)))

        return SolverResult(
            schedule=Schedule(school_id=inp.school_id, entries=entries, quality_score=quality),
            status=status_name,
            quality_score=quality,
        )

    conflict = ""
    if status == cp_model.INFEASIBLE:
        conflict = _explain_infeasibility(inp)

    return SolverResult(schedule=None, status=status_name, quality_score=0.0,
                        conflict_explanation=conflict)


def _parse_unavailable_constraints(
    constraints: list[Constraint], ctype: str
) -> dict[tuple[UUID, UUID], Constraint]:
    result = {}
    for c in constraints:
        if c.type == ctype and c.weight == 0:
            for ts_id_str in c.parameters.get("timeslot_ids", []):
                result[(c.target_id, UUID(ts_id_str))] = c
    return result


def _explain_infeasibility(inp: SolverInput) -> str:
    total_slots = len(inp.timeslots)
    total_hours = sum(r.weekly_hours for r in inp.requirements)
    lines = [
        f"Program üretilemedi (INFEASIBLE).",
        f"Toplam atama gereken ders saati: {total_hours}",
        f"Kullanılabilir slot sayısı: {total_slots}",
    ]
    if total_hours > total_slots:
        lines.append("Neden: Haftalık ders saati toplamı mevcut slotları aşıyor.")
    # Check per-teacher overload
    for teacher in inp.teachers:
        teacher_hours = sum(r.weekly_hours for r in inp.requirements if r.teacher_id == teacher.id)
        if teacher_hours > total_slots:
            lines.append(f"Öğretmen '{teacher.name}' {teacher_hours} saat atandı ama yalnızca {total_slots} slot var.")
    return " ".join(lines)
