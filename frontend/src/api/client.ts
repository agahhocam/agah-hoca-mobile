import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const api = axios.create({ baseURL: BASE_URL });

export const schoolsApi = {
  list: () => api.get("/schools/").then((r) => r.data),
  create: (name: string, days = 5, periodsPerDay = 8) =>
    api.post("/schools/", { name, days, periods_per_day: periodsPerDay }).then((r) => r.data),
};

export const teachersApi = {
  list: (schoolId: string) => api.get(`/schools/${schoolId}/teachers/`).then((r) => r.data),
  create: (schoolId: string, name: string, subjectIds: string[]) =>
    api.post(`/schools/${schoolId}/teachers/`, { name, subject_ids: subjectIds }).then((r) => r.data),
  delete: (schoolId: string, teacherId: string) =>
    api.delete(`/schools/${schoolId}/teachers/${teacherId}`),
};

export const subjectsApi = {
  list: (schoolId: string) => api.get(`/schools/${schoolId}/subjects/`).then((r) => r.data),
  create: (schoolId: string, name: string) =>
    api.post(`/schools/${schoolId}/subjects/`, { name }).then((r) => r.data),
};

export const classesApi = {
  list: (schoolId: string) => api.get(`/schools/${schoolId}/classes/`).then((r) => r.data),
  create: (schoolId: string, name: string) =>
    api.post(`/schools/${schoolId}/classes/`, { name }).then((r) => r.data),
};

export const lessonsApi = {
  list: (schoolId: string) => api.get(`/schools/${schoolId}/lessons/`).then((r) => r.data),
  create: (schoolId: string, payload: {
    class_id: string; subject_id: string; teacher_id: string; weekly_hours: number;
  }) => api.post(`/schools/${schoolId}/lessons/`, payload).then((r) => r.data),
};

export const constraintsApi = {
  list: (schoolId: string) => api.get(`/schools/${schoolId}/constraints/`).then((r) => r.data),
  types: () => api.get("/schools/x/constraints/types").then((r) => r.data),
  create: (schoolId: string, payload: {
    type: string; target_id?: string; parameters?: object; weight: number;
  }) => api.post(`/schools/${schoolId}/constraints/`, payload).then((r) => r.data),
  delete: (schoolId: string, constraintId: string) =>
    api.delete(`/schools/${schoolId}/constraints/${constraintId}`),
};

export const schedulesApi = {
  generate: (schoolId: string, timeLimitSecs = 60) =>
    api.post(`/schools/${schoolId}/schedules/generate`, { time_limit_secs: timeLimitSecs }).then((r) => r.data),
  revise: (schoolId: string, absentTeacherId: string, affectedTimeslotIds: string[]) =>
    api.post(`/schools/${schoolId}/schedules/revise`, {
      absent_teacher_id: absentTeacherId,
      affected_timeslot_ids: affectedTimeslotIds,
    }).then((r) => r.data),
  export: (schoolId: string) =>
    api.get(`/schools/${schoolId}/schedules/export`).then((r) => r.data),
  list: (schoolId: string) =>
    api.get(`/schools/${schoolId}/schedules/`).then((r) => r.data),
};
