import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/common/ProtectedRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import PasswordResetConfirmPage from '@/pages/auth/PasswordResetConfirmPage'

import DashboardPage from '@/pages/DashboardPage'
import EmployeesPage from '@/pages/employees/EmployeesPage'
import PositionsPage from '@/pages/positions/PositionsPage'
import JobsPage from '@/pages/jobs/JobsPage'
import ApplicantsPage from '@/pages/applicants/ApplicantsPage'
import ApplicantProfilePage from '@/pages/applicants/ApplicantProfilePage'
import JobApplicationsPage from '@/pages/job-applications/JobApplicationsPage'
import InterviewsPage from '@/pages/interviews/InterviewsPage'
import TimeOffPage from '@/pages/time-off/TimeOffPage'
import PerformancePage from '@/pages/performance/PerformancePage'
import SkillsPage from '@/pages/skills/SkillsPage'
import EducationPage from '@/pages/education/EducationPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ProfilePage from '@/pages/profile/ProfilePage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/applicants" element={<ApplicantsPage />} />
        <Route path="/applicants/:id" element={<ApplicantProfilePage />} />
        <Route path="/job-applications" element={<JobApplicationsPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/time-off" element={<TimeOffPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
