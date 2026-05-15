from fastapi import APIRouter
from app.api.v1.endpoints import schools, teachers, subjects, classes, lessons, constraints, schedules

router = APIRouter()
router.include_router(schools.router)
router.include_router(teachers.router)
router.include_router(subjects.router)
router.include_router(classes.router)
router.include_router(lessons.router)
router.include_router(constraints.router)
router.include_router(schedules.router)
