import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminStudents from "@/pages/admin/students";
import AdminTeachers from "@/pages/admin/teachers";
import AdminClasses from "@/pages/admin/classes";
import AdminSubjects from "@/pages/admin/subjects";
import AdminFees from "@/pages/admin/fees";
import AdminExams from "@/pages/admin/exams";
import AdminTimetable from "@/pages/admin/timetable";
import AdminAttendance from "@/pages/admin/attendance";
import AdminAnnouncements from "@/pages/admin/announcements";
import AdminLeaves from "@/pages/admin/leaves";

import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherAssignments from "@/pages/teacher/assignments";
import TeacherAttendance from "@/pages/teacher/attendance";
import TeacherExams from "@/pages/teacher/exams";
import TeacherResults from "@/pages/teacher/results";
import TeacherAnnouncements from "@/pages/teacher/announcements";
import TeacherTimetable from "@/pages/teacher/timetable";

import StudentDashboard from "@/pages/student/dashboard";
import StudentAttendance from "@/pages/student/attendance";
import StudentAssignments from "@/pages/student/assignments";
import StudentExams from "@/pages/student/exams";
import StudentResults from "@/pages/student/results";
import StudentFees from "@/pages/student/fees";
import StudentTimetable from "@/pages/student/timetable";
import StudentLeaves from "@/pages/student/leaves";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  allowedRole
}: {
  component: React.ComponentType;
  allowedRole?: "admin" | "teacher" | "student"
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Redirect to={`/${user?.role}`} />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <Redirect to={`/${user?.role}`} /> : <Redirect to="/login" />}
      </Route>
      <Route path="/login" component={Login} />

      {/* Admin Routes */}
      <Route path="/admin">
        <AppLayout><ProtectedRoute component={AdminDashboard} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/students">
        <AppLayout><ProtectedRoute component={AdminStudents} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/teachers">
        <AppLayout><ProtectedRoute component={AdminTeachers} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/classes">
        <AppLayout><ProtectedRoute component={AdminClasses} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/subjects">
        <AppLayout><ProtectedRoute component={AdminSubjects} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/fees">
        <AppLayout><ProtectedRoute component={AdminFees} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/exams">
        <AppLayout><ProtectedRoute component={AdminExams} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/timetable">
        <AppLayout><ProtectedRoute component={AdminTimetable} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/attendance">
        <AppLayout><ProtectedRoute component={AdminAttendance} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/announcements">
        <AppLayout><ProtectedRoute component={AdminAnnouncements} allowedRole="admin" /></AppLayout>
      </Route>
      <Route path="/admin/leaves">
        <AppLayout><ProtectedRoute component={AdminLeaves} allowedRole="admin" /></AppLayout>
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher">
        <AppLayout><ProtectedRoute component={TeacherDashboard} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/assignments">
        <AppLayout><ProtectedRoute component={TeacherAssignments} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/attendance">
        <AppLayout><ProtectedRoute component={TeacherAttendance} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/exams">
        <AppLayout><ProtectedRoute component={TeacherExams} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/results">
        <AppLayout><ProtectedRoute component={TeacherResults} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/announcements">
        <AppLayout><ProtectedRoute component={TeacherAnnouncements} allowedRole="teacher" /></AppLayout>
      </Route>
      <Route path="/teacher/timetable">
        <AppLayout><ProtectedRoute component={TeacherTimetable} allowedRole="teacher" /></AppLayout>
      </Route>

      {/* Student Routes */}
      <Route path="/student">
        <AppLayout><ProtectedRoute component={StudentDashboard} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/attendance">
        <AppLayout><ProtectedRoute component={StudentAttendance} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/assignments">
        <AppLayout><ProtectedRoute component={StudentAssignments} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/exams">
        <AppLayout><ProtectedRoute component={StudentExams} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/results">
        <AppLayout><ProtectedRoute component={StudentResults} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/fees">
        <AppLayout><ProtectedRoute component={StudentFees} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/timetable">
        <AppLayout><ProtectedRoute component={StudentTimetable} allowedRole="student" /></AppLayout>
      </Route>
      <Route path="/student/leaves">
        <AppLayout><ProtectedRoute component={StudentLeaves} allowedRole="student" /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
