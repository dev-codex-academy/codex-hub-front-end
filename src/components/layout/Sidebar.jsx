import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, Calendar,
  Star, ClipboardList, UserSearch, FileText, Video, LogOut,
  Zap, GraduationCap, Bell, CircleUser,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Swal from 'sweetalert2'

// Nav shown to HR staff (has groups or is_staff)
const HR_NAV = [
  {
    title: null,
    items: [{ label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard }],
  },
  {
    title: 'HR Management',
    items: [
      { label: 'Employees',           to: '/employees',   Icon: Users },
      { label: 'Positions',           to: '/positions',   Icon: Briefcase },
      { label: 'Time Off',            to: '/time-off',    Icon: Calendar },
      { label: 'Performance Reviews', to: '/performance', Icon: Star },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { label: 'Jobs',             to: '/jobs',             Icon: ClipboardList },
      { label: 'Applicants',       to: '/applicants',       Icon: UserSearch },
      { label: 'Job Applications', to: '/job-applications', Icon: FileText },
      { label: 'Interviews',       to: '/interviews',       Icon: Video },
    ],
  },
  {
    title: 'Applicant Data',
    items: [
      { label: 'Skills Catalog', to: '/skills',        Icon: Zap },
      { label: 'Education',      to: '/education',     Icon: GraduationCap },
      { label: 'Notifications',  to: '/notifications', Icon: Bell },
    ],
  },
]

// Nav shown to applicants (no groups, not staff)
const APPLICANT_NAV = [
  {
    title: null,
    items: [
      { label: 'CodeX Hub',    to: '/codexhub/students', Icon: GraduationCap },
      { label: 'My Profile',    to: '/profile',          Icon: CircleUser },
      { label: 'Jobs',          to: '/jobs',              Icon: ClipboardList },
      { label: 'My Applications', to: '/job-applications', Icon: FileText },
      { label: 'Notifications', to: '/notifications',    Icon: Bell },
    ],
  },
]

export default function Sidebar({ onClose }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const isApplicant = user && !user.is_staff && (!user.groups || user.groups.length === 0)
  const NAV = isApplicant ? APPLICANT_NAV : HR_NAV

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
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">HR</div>
        <span className="sidebar-logo-name">
          CodeX Hub
          <span className="sidebar-logo-dot" />
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="sidebar-section-title">{section.title}</p>
            )}
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

      {/* Footer */}
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
