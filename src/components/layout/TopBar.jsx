import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const TITLES = {
  '/dashboard':        'Dashboard',
  '/employees':        'Employees',
  '/positions':        'Positions',
  '/time-off':         'Time Off Requests',
  '/performance':      'Performance Reviews',
  '/jobs':             'Jobs',
  '/applicants':       'Applicants',
  '/job-applications': 'Job Applications',
  '/interviews':       'Interviews',
}

export default function TopBar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'CodeX Hub'

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
        <Menu size={18} />
      </button>
      <h1 className="topbar-title">{title}</h1>
    </header>
  )
}
