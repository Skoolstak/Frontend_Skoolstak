import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ProtectedRoute } from './utils/ProtectedRoute';

// Auth pages
import LoginPage  from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePassword';

// Layouts
import AdminLayout from './components/layout/AdminLayout';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/Dashboard';

// School Admin
import AdminDashboard from './pages/admin/Dashboard';
import Students       from './pages/admin/Students';
import Staff          from './pages/admin/Staff';
import Classes        from './pages/admin/Classes';
import Finance        from './pages/admin/Finance';
import Library        from './pages/admin/Library';
import Attendance     from './pages/admin/Attendance';
import Timetable      from './pages/admin/Timetable';
import Subjects       from './pages/admin/Subjects';
import Reports        from './pages/admin/Reports';
import Alumni         from './pages/admin/Alumni';

// Teacher
import TeacherDashboard  from './pages/teacher/Dashboard';
import TeacherTimetable  from './pages/teacher/Timetable';
import Gradebook         from './pages/teacher/Gradebook';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherClasses    from './pages/teacher/Classes';

// Student
import StudentDashboard   from './pages/student/Dashboard';
import StudentTimetable   from './pages/student/Timetable';
import AcademicRecords    from './pages/student/AcademicRecords';
import StudentAttendance  from './pages/student/Attendance';
import StudentAssignments from './pages/student/Assignments';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/"       element={<Navigate to="/login" replace />} />

          {/* Change Password - Accessible to all authenticated users */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'school_admin', 'teacher', 'student']}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin */}
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminLayout role="super_admin">
                  <Routes>
                    <Route index element={<SuperAdminDashboard />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* School Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['school_admin']}>
                <AdminLayout role="school_admin">
                  <Routes>
                    <Route index              element={<AdminDashboard />} />
                    <Route path="students"    element={<Students />} />
                    <Route path="staff"       element={<Staff />} />
                    <Route path="classes"     element={<Classes />} />
                    <Route path="attendance"  element={<Attendance />} />
                    <Route path="timetable"   element={<Timetable />} />
                    <Route path="finance"     element={<Finance />} />
                    <Route path="library"     element={<Library />} />
                    <Route path="subjects"    element={<Subjects />} />
                    <Route path="reports"     element={<Reports />} />
                    <Route path="alumni"      element={<Alumni />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Teacher */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <AdminLayout role="teacher">
                  <Routes>
                    <Route index             element={<TeacherDashboard />} />
                    <Route path="timetable"  element={<TeacherTimetable />} />
                    <Route path="gradebook"  element={<Gradebook />} />
                    <Route path="attendance" element={<TeacherAttendance />} />
                    <Route path="classes"    element={<TeacherClasses />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AdminLayout role="student">
                  <Routes>
                    <Route index                   element={<StudentDashboard />} />
                    <Route path="timetable"        element={<StudentTimetable />} />
                    <Route path="academic-records" element={<AcademicRecords />} />
                    <Route path="attendance"       element={<StudentAttendance />} />
                    <Route path="assignments"      element={<StudentAssignments />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

