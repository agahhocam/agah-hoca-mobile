"""
Compute a 0-100 quality score from a solved schedule.

Criteria (equal weight):
  1. Teacher satisfaction    – low afternoon / first-period usage
  2. Gap count               – teacher idle gaps between lessons on same day
  3. Consecutive lesson rate – back-to-back lessons for same class+subject
  4. Schedule stability      – placeholder (1.0 for freshly generated schedules)
"""

from __future__ import annotations
from collections import defaultdict

from app.domain.entities.school import Schedule, ScheduleEntry, Timeslot

AFTERNOON_START = 5


def compute_score(schedule: Schedule, timeslots: list[Timeslot]) -> float:
    ts_map = {ts.id: ts for ts in timeslots}
    entries = schedule.entries

    teacher_satisfaction = _teacher_satisfaction(entries, ts_map)
    gap_score = _gap_score(entries, ts_map)
    consecutive_score = _consecutive_score(entries, ts_map)
    stability_score = 1.0  # always 1.0 for new schedules

    raw = (teacher_satisfaction + gap_score + consecutive_score + stability_score) / 4
    return round(raw * 100, 1)


def _teacher_satisfaction(entries: list[ScheduleEntry], ts_map: dict) -> float:
    if not entries:
        return 1.0
    afternoon_count = sum(
        1 for e in entries if ts_map[e.timeslot_id].period >= AFTERNOON_START
    )
    return 1.0 - (afternoon_count / len(entries))


def _gap_score(entries: list[ScheduleEntry], ts_map: dict) -> float:
    by_teacher_day: dict[tuple, list[int]] = defaultdict(list)
    for e in entries:
        ts = ts_map[e.timeslot_id]
        by_teacher_day[(e.teacher_id, ts.day)].append(ts.period)

    if not by_teacher_day:
        return 1.0

    total_gaps = 0
    total_spans = 0
    for periods in by_teacher_day.values():
        periods.sort()
        span = periods[-1] - periods[0] + 1
        gaps = span - len(periods)
        total_gaps += gaps
        total_spans += span

    if total_spans == 0:
        return 1.0
    return 1.0 - (total_gaps / total_spans)


def _consecutive_score(entries: list[ScheduleEntry], ts_map: dict) -> float:
    by_class_subject_day: dict[tuple, list[int]] = defaultdict(list)
    for e in entries:
        ts = ts_map[e.timeslot_id]
        by_class_subject_day[(e.class_id, e.subject_id, ts.day)].append(ts.period)

    if not by_class_subject_day:
        return 1.0

    consecutive = 0
    total = 0
    for periods in by_class_subject_day.values():
        periods.sort()
        for i in range(len(periods) - 1):
            total += 1
            if periods[i + 1] == periods[i] + 1:
                consecutive += 1

    if total == 0:
        return 1.0
    return consecutive / total
