import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Briefcase, FileText, Video,
  Clock, TrendingUp, ArrowRight, GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import employeeService       from '@/services/employeeService'
import jobService            from '@/services/jobService'
import jobApplicationService from '@/services/jobApplicationService'
import interviewService      from '@/services/interviewService'
import StudentsPage          from '@/pages/codexhub/StudentsPage'
import TeacherPage           from '@/pages/codexhub/TeacherPage'
import TAPage                from '@/pages/codexhub/TAPage'

const STAT_CARDS = [
  { key: 'employees',    label: 'Total Employees',     Icon: Users,     iconBg: '#4E89BD', bar: '#61AFEE', to: '/employees' },
  { key: 'openJobs',     label: 'Open Jobs',           Icon: Briefcase, iconBg: '#3d6e98', bar: '#4E89BD', to: '/jobs' },
  { key: 'applications', label: 'Active Applications', Icon: FileText,  iconBg: '#4E89BD', bar: '#61AFEE', to: '/job-applications' },
  { key: 'interviews',   label: 'Interviews Today',    Icon: Video,     iconBg: '#E06C75', bar: '#AD545B', to: '/interviews' },
]

const QUICK_ACTIONS = [
  { label: 'Add New Employee',         to: '/employees',        Icon: Users,      iconBg: '#4E89BD' },
  { label: 'Post a Job',               to: '/jobs',             Icon: Briefcase,  iconBg: '#3d6e98' },
  { label: 'Review Applications',      to: '/job-applications', Icon: FileText,   iconBg: '#4E89BD' },
  { label: 'Schedule an Interview',    to: '/interviews',       Icon: Video,      iconBg: '#E06C75' },
  { label: 'Manage Time Off Requests', to: '/time-off',         Icon: Clock,      iconBg: '#3d6e98' },
  { label: 'Open CodeX Hub',           to: '/codexhub/students', Icon: GraduationCap, iconBg: '#E06C75' },
]

const MODULES = [
  { label: 'Employee Management',     Icon: Users,      iconBg: '#4E89BD' },
  { label: 'Position & Salary Bands', Icon: Briefcase,  iconBg: '#3d6e98' },
  { label: 'Recruitment Pipeline',    Icon: FileText,   iconBg: '#4E89BD' },
  { label: 'Time Off Tracking',       Icon: Clock,      iconBg: '#3d6e98' },
  { label: 'Performance Reviews',     Icon: TrendingUp, iconBg: '#E06C75' },
]



function StatCard({ label, value, Icon, iconBg, bar, to, loading }) {
  const num = value ?? 0
  const pct = Math.min(100, Math.round((num / 200) * 100))
  return (
    <Link to={to} className="stat-card stat-card-revamp">
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: iconBg }}>
          <Icon strokeWidth={2} />
        </div>
        {/* Status chip removed for now */}
      </div>
      <p className="stat-card-label">{label}</p>
      {loading
        ? <div className="stat-card-skeleton" />
        : <p className="stat-card-value">{num.toLocaleString()}</p>
      }
      <div className="stat-card-footer">
        <button className="stat-card-cta" type="button">
          View details <ArrowRight />
        </button>
        <div className="stat-card-bar-track">
          <div
            className="stat-card-bar-fill"
            style={{ width: loading ? '0%' : `${pct}%`, background: bar }}
          />
        </div>
      </div>
    </Link>
  )
}

function ActionRow({ label, to, Icon, iconBg }) {
  return (
    <Link to={to} className="action-row">
      <div className="action-row-icon" style={{ background: iconBg }}>
        <Icon strokeWidth={2} />
      </div>
      <span className="action-row-label">{label}</span>
      <span className="action-row-arrow"><ArrowRight /></span>
    </Link>
  )
}

function ActionTile({ label, to, Icon, iconBg }) {
  return (
    <Link to={to} className="action-tile">
      <div className="action-tile-icon" style={{ background: iconBg }}>
        <Icon strokeWidth={2} />
      </div>
      <div className="action-tile-body">
        <span className="action-tile-label">{label}</span>
        <span className="action-tile-link">
          Go <ArrowRight />
        </span>
      </div>
    </Link>
  )
}

function ModuleRow({ label, Icon, iconBg }) {
  return (
    <div className="module-row">
      <div className="module-row-icon" style={{ background: iconBg }}>
        <Icon strokeWidth={2} />
      </div>
      <span className="module-row-label">{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const perms        = new Set(user?.permissions ?? [])
  const isStaff      = user?.is_staff || perms.has('app.change_jobapplication')
  const isTA         = !isStaff && perms.has('app.add_tahourslog')
  const isInstructor = !isStaff && !isTA && perms.has('app.add_studentspotlight')
  const isStudent    = !isStaff && !isTA && !isInstructor

  const [stats, setStats] = useState({
    employees: 142, openJobs: 8, applications: 34, interviews: 3,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const iso = new Date().toISOString().split('T')[0]
    Promise.allSettled([
      employeeService.getAll({ page_size: 1 }),
      jobService.getAll({ status: 'open', page_size: 1 }),
      jobApplicationService.getAll({ page_size: 1 }),
      interviewService.getAll({ scheduled_date: iso, page_size: 1 }),
    ]).then(([emp, jobs, apps, ivws]) => {
      const n = (r) => r.status === 'fulfilled'
        ? (r.value?.data?.count ?? r.value?.data?.length ?? null)
        : null
      setStats((prev) => ({
        employees:    n(emp)  ?? prev.employees,
        openJobs:     n(jobs) ?? prev.openJobs,
        applications: n(apps) ?? prev.applications,
        interviews:   n(ivws) ?? prev.interviews,
      }))
      setLoading(false)
    })
  }, [])

  if (isStudent)    return <StudentsPage />
  if (isTA)         return <TAPage />
  if (isInstructor) return <TeacherPage />

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.username ?? 'there')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="dashboard dashboard-revamp">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-hero">
          <div className="dash-hero-top">
            <span className="dash-date">{today}</span>
            <span className="dash-pill">Live</span>
          </div>
          <h2 className="dash-title">Welcome back, {name}!</h2>
          <p className="dash-sub">Here’s your HR command center — hiring, people, and performance at a glance.</p>
          <div className="dash-hero-actions">
            {[QUICK_ACTIONS[0], QUICK_ACTIONS[2], QUICK_ACTIONS[3]].map((a) => (
              <ActionRow key={a.to} {...a} />
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats">
        {STAT_CARDS.map(({ key, label, Icon, iconBg, bar, to }) => (
          <StatCard
            key={key}
            label={label}
            value={stats[key]}
            Icon={Icon}
            iconBg={iconBg}
            bar={bar}
            to={to}
            loading={loading}
          />
        ))}
      </div>

      

      {/* Bottom row */}
      <div className="dash-grid">
        <div className="dash-panel">
          <div className="dash-panel-header">
            <TrendingUp />
            <h3>Quick Actions</h3>
          </div>
          <div className="dash-actions-grid">
            {QUICK_ACTIONS.map((a) => (
              <ActionTile key={a.to} {...a} />
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header">
            <FileText />
            <h3>HR Modules</h3>
          </div>
          <div className="dash-module-list">
            {MODULES.map((m) => (
              <ModuleRow key={m.label} {...m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
