import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import ProfilePage from '@/pages/profile/ProfilePage'
import CodexHubProfilePage from '@/pages/codexhub/CodexHubProfilePage'
import InstructorProfilePage from '@/pages/profile/InstructorProfilePage'

export default function ProfileGate() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const perms = new Set(user.permissions ?? [])
  const isStaff      = user.is_staff || perms.has('app.change_jobapplication')
  const isTA         = !isStaff && perms.has('app.add_tahourslog')
  const isInstructor = !isStaff && !isTA && perms.has('app.add_studentspotlight')
  const isStudent    = !isStaff && !isTA && !isInstructor

  if (isTA || isInstructor) return <InstructorProfilePage />
  if (isStudent)            return <CodexHubProfilePage />
  return <ProfilePage />
}
