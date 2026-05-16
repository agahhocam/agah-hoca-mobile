import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import TeachersPage from "./pages/TeachersPage";
import ClassesPage from "./pages/ClassesPage";
import SubjectsPage from "./pages/SubjectsPage";
import LessonsPage from "./pages/LessonsPage";
import ConstraintBuilderPage from "./pages/ConstraintBuilderPage";
import SchedulePage from "./pages/SchedulePage";
import TimetableGrid from "./pages/TimetableGrid";
import PrintPage from "./pages/PrintPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="lessons" element={<LessonsPage />} />
          <Route path="constraints" element={<ConstraintBuilderPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="timetable" element={<TimetableGrid />} />
          <Route path="print" element={<PrintPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
