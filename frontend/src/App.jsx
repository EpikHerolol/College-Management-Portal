import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/common/DashboardLayout';

// Public Pages
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CoursesPage } from './pages/admin/CoursesPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { FacultyPage } from './pages/admin/FacultyPage';
import { ReportsPage } from './pages/admin/ReportsPage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AttendancePage } from './pages/faculty/AttendancePage';
import { ResultsPage } from './pages/faculty/ResultsPage';
import { FacultyProfilePage } from './pages/faculty/FacultyProfilePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseRegistrationPage } from './pages/student/CourseRegistrationPage';
import { MyAttendancePage } from './pages/student/MyAttendancePage';
import { MyResultsPage } from './pages/student/MyResultsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Root Redirect Helper
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<CoursesPage />} />
              <Route path="/admin/students" element={<StudentsPage />} />
              <Route path="/admin/faculty" element={<FacultyPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Faculty Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty/attendance" element={<AttendancePage />} />
              <Route path="/faculty/results" element={<ResultsPage />} />
              <Route path="/faculty/profile" element={<FacultyProfilePage />} />
            </Route>
          </Route>

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/register-courses" element={<CourseRegistrationPage />} />
              <Route path="/student/attendance" element={<MyAttendancePage />} />
              <Route path="/student/results" element={<MyResultsPage />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

