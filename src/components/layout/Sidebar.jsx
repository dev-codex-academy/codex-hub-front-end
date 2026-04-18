import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, ClipboardList, UserSearch,
  FileText, Video, LogOut, Zap, GraduationCap, Bell, CircleUser,
  Newspaper, Star, Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Swal from 'sweetalert2'

/**
 * Master nav item list.
 *
 * audience:
 *   'all'              → always visible (Dashboard)
 *   'staff'            → only privileged users (Hub Admin, Operations, Staff)
 *   'instructor'       → only Teacher
 *   'ta'               → only TA
 *   'student'          → only students (Applicant)
 *   'staff_instructor' → privileged OR instructor
 *
 * permission (optional): Django codename in 'app.<codename>' format.
 *   If the logged-in user lacks this permission the item is hidden,
 *   regardless of audience.
 */
const NAV_ITEMS = [
  // ── always ───────────────────────────────────────────────────────
  { label: 'Dashboard',  to: '/dashboard', Icon: LayoutDashboard, section: null, audience: 'all' },

  // ── HR Management ─────────────────────────────────────────────
  { label: 'Employees',  to: '/employees',  Icon: Users,     section: 'HR Management', permission: 'app.view_employee',  audience: 'staff' },
  { label: 'Positions',  to: '/positions',  Icon: Briefcase, section: 'HR Management', permission: 'app.view_position',  audience: 'staff' },

  // ── Recruitment ───────────────────────────────────────────────
  { label: 'Jobs',             to: '/jobs',             Icon: ClipboardList, section: 'Recruitment', permission: 'app.view_job',             audience: 'staff' },
  { label: 'Students',         to: '/applicants',       Icon: UserSearch,    section: 'Recruitment', permission: 'app.view_applicant',        audience: 'staff' },
  { label: 'Job Applications', to: '/job-applications', Icon: FileText,      section: 'Recruitment', permission: 'app.change_jobapplication',  audience: 'staff' },
  { label: 'Interviews',       to: '/interviews',       Icon: Video,         section: 'Recruitment', permission: 'app.view_interview',        audience: 'staff' },

  // ── Data ──────────────────────────────────────────────────────
  { label: 'Skills Catalog', to: '/skills',        Icon: Zap,           section: 'Data', permission: 'app.view_skill',        audience: 'staff' },
  { label: 'Education',      to: '/education',     Icon: GraduationCap, section: 'Data', permission: 'app.view_education',    audience: 'staff' },
  { label: 'Notifications',  to: '/notifications', Icon: Bell,          section: 'Data', permission: 'app.view_notification', audience: 'staff' },

  // ── Community (staff + instructors) ──────────────────────────
  { label: 'Student Spotlights', to: '/community/spotlights', Icon: Star,      section: 'Community', permission: 'app.view_studentspotlight', audience: 'staff_instructor' },

  // ── Instructor personal ───────────────────────────────────────
  { label: 'My Profile', to: '/profile', Icon: CircleUser, section: null, audience: 'instructor' },

  // ── TA portal ─────────────────────────────────────────────────
  { label: 'My Logs',    to: '/ta/logs', Icon: Clock,      section: 'TA Portal', audience: 'ta', permission: 'app.add_tahourslog' },
  { label: 'My Profile', to: '/profile', Icon: CircleUser, section: null,        audience: 'ta' },

  // ── Student portal ────────────────────────────────────────────
  { label: 'CodeX Hub',       to: '/codexhub/students',   Icon: GraduationCap, section: null, audience: 'student' },
  { label: 'My Profile',      to: '/profile',              Icon: CircleUser,    section: null, audience: 'student' },
  { label: 'Jobs',            to: '/codexhub/jobs',        Icon: ClipboardList, section: null, audience: 'student', permission: 'app.view_job' },
  { label: 'My Applications', to: '/job-applications',     Icon: FileText,      section: null, audience: 'student', permission: 'app.view_jobapplication' },
  { label: 'Instructors',     to: '/codexhub/instructors', Icon: Star,          section: null, audience: 'student' },
  { label: 'Notifications',   to: '/notifications',        Icon: Bell,          section: null, audience: 'student', permission: 'app.view_notification' },
]

/** Derive role purely from the permission set returned by /api/me/ */
function deriveRole(user) {
  if (!user) return 'student'
  if (user.is_staff) return 'staff'
  const perms = new Set(user.permissions ?? [])
  if (perms.has('app.change_jobapplication')) return 'staff'
  if (perms.has('app.add_tahourslog'))        return 'ta'
  if (perms.has('app.add_studentspotlight'))  return 'instructor'
  return 'student'
}

export default function Sidebar({ onClose }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const role  = deriveRole(user)
  const perms = new Set(user?.permissions ?? [])

  // Filter items by audience and permission
  const visible = NAV_ITEMS.filter(item => {
    if (item.audience !== 'all') {
      if (item.audience === 'staff_instructor') {
        if (role !== 'staff' && role !== 'instructor' && role !== 'ta') return false
      } else if (item.audience !== role) {
        return false
      }
    }
    if (item.permission && !perms.has(item.permission)) return false
    return true
  })

  // Group by section preserving order
  const sections = []
  let lastSection = Symbol() // guaranteed unique sentinel
  for (const item of visible) {
    const sKey = item.section ?? null
    if (sKey !== lastSection) {
      sections.push({ title: sKey, items: [] })
      lastSection = sKey
    }
    sections[sections.length - 1].items.push(item)
  }

  const handleLogout = async () => {
    const r = await Swal.fire({
      title: 'Sign out?',
      text: 'You will be redirected to the login page.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4E89BD',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sign out',
    })
    if (r.isConfirmed) { await logout(); navigate('/login') }
  }

  const initials = user
    ? (user.first_name?.[0] ?? user.username?.[0] ?? 'U').toUpperCase()
    : 'U'
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.username ?? '')

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">HR</div>
        <span className="sidebar-logo-name">
          CodeX Hub
          <span className="sidebar-logo-dot" />
        </span>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && <p className="sidebar-section-title">{section.title}</p>}
            <ul>
              {section.items.map(({ label, to, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) => isActive ? 'active' : ''}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
