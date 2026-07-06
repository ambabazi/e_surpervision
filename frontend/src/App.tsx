import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";
import type { Role } from "@/types";

import Login, { LoginPortalPicker } from "@/pages/Login";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentTasks from "@/pages/student/StudentTasks";
import StudentProgress from "@/pages/student/StudentProgress";
import StudentSubmissions from "@/pages/student/StudentSubmissions";
import StudentFeedback from "@/pages/student/StudentFeedback";
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";
import SupervisorStudents from "@/pages/supervisor/SupervisorStudents";
import SupervisorReviews from "@/pages/supervisor/SupervisorReviews";
import HodDashboard from "@/pages/hod/HodDashboard";
import HodSupervisors from "@/pages/hod/HodSupervisors";
import HodSupervisorDetail from "@/pages/hod/HodSupervisorDetail";
import HodFacultyOverview from "@/pages/hod/HodFacultyOverview";
import TopicProposalForm from "@/pages/TopicProposalForm";
import HodProposals from "@/pages/hod/HodProposals";
import HodRequests from "@/pages/hod/HodRequests";
import HodStudents from "@/pages/hod/HodStudents";
import Alerts from "@/pages/Alerts";
import Profile from "@/pages/Profile";

const HOME: Record<Role, string> = {
  STUDENT: "/student",
  SUPERVISOR: "/supervisor",
  HOD: "/hod",
};

function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Loading portal..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={HOME[user.role]} replace /> : <LoginPortalPicker />}
      />
      <Route
        path="/login/student"
        element={user ? <Navigate to={HOME[user.role]} replace /> : <Login role="STUDENT" />}
      />
      <Route
        path="/login/supervisor"
        element={user ? <Navigate to={HOME[user.role]} replace /> : <Login role="SUPERVISOR" />}
      />
      <Route
        path="/login/hod"
        element={user ? <Navigate to={HOME[user.role]} replace /> : <Login role="HOD" />}
      />

      <Route path="/apply" element={<TopicProposalForm />} />

      <Route
        element={
          user ? <AppLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route
          path="/"
          element={<Navigate to={user ? HOME[user.role] : "/login"} replace />}
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/student/tasks"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentTasks />
            </RequireRole>
          }
        />
        <Route
          path="/student/progress"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentProgress />
            </RequireRole>
          }
        />
        <Route
          path="/student/submissions"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentSubmissions />
            </RequireRole>
          }
        />
        <Route
          path="/student/feedback"
          element={
            <RequireRole roles={["STUDENT"]}>
              <StudentFeedback />
            </RequireRole>
          }
        />

        {/* Supervisor */}
        <Route
          path="/supervisor"
          element={
            <RequireRole roles={["SUPERVISOR", "HOD"]}>
              <SupervisorDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/supervisor/students"
          element={
            <RequireRole roles={["SUPERVISOR", "HOD"]}>
              <SupervisorStudents />
            </RequireRole>
          }
        />
        <Route
          path="/supervisor/reviews"
          element={
            <RequireRole roles={["SUPERVISOR", "HOD"]}>
              <SupervisorReviews />
            </RequireRole>
          }
        />

        {/* HOD */}
        <Route
          path="/hod"
          element={
            <RequireRole roles={["HOD"]}>
              <HodDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/hod/supervisors"
          element={
            <RequireRole roles={["HOD"]}>
              <HodSupervisors />
            </RequireRole>
          }
        />
        <Route
          path="/hod/supervisors/:supervisorId"
          element={
            <RequireRole roles={["HOD"]}>
              <HodSupervisorDetail />
            </RequireRole>
          }
        />
        <Route
          path="/hod/faculty"
          element={
            <RequireRole roles={["HOD"]}>
              <HodFacultyOverview />
            </RequireRole>
          }
        />
        <Route
          path="/hod/students"
          element={
            <RequireRole roles={["HOD"]}>
              <HodStudents />
            </RequireRole>
          }
        />
        <Route
          path="/hod/proposals"
          element={
            <RequireRole roles={["HOD"]}>
              <HodProposals />
            </RequireRole>
          }
        />
        <Route
          path="/hod/requests"
          element={
            <RequireRole roles={["HOD"]}>
              <HodRequests />
            </RequireRole>
          }
        />

        {/* Shared */}
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
