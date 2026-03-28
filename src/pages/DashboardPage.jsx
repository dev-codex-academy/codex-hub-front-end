import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, Briefcase, FileText, Video,
  Clock, TrendingUp, ArrowRight, CircleUser,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import employeeService       from '@/services/employeeService'
import jobService            from '@/services/jobService'
import jobApplicationService from '@/services/jobApplicationService'
import interviewService      from '@/services/interviewService'

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
    <Link to={to} className="stat-card">
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <Icon strokeWidth={2} />
      </div>
      <p className="stat-card-label">{label}</p>
      {loading
        ? <div className="stat-card-skeleton" />
        : <p className="stat-card-value">{num.toLocaleString()}</p>
      }
      <div className="stat-card-footer">
        <span className="stat-card-link-text">
          View all <ArrowRight />
        </span>
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
  const navigate = useNavigate()

  // Redirect applicants (no group, not staff) straight to their profile
  useEffect(() => {
    if (user && !user.is_staff && (!user.groups || user.groups.length === 0)) {
      navigate('/profile', { replace: true })
    }
  }, [user, navigate])

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

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.username ?? 'there')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div
        className="dashboard-banner"
        style={{ background: 'linear-gradient(135deg, #4E89BD 0%, #61AFEE 100%)' }}
      >
        {/* mesh overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '28px 28px',
        }} />
        {/* glow circles */}
        <div style={{ position:'absolute', right:0, top:0, width:'280px', height:'100%', overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', right:'-40px', top:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
          <div style={{ position:'absolute', right:'32px', bottom:'-20px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <p className="dashboard-banner-date">{today}</p>
          <h2 className="dashboard-banner-title">Welcome back, {name}!</h2>
          <p className="dashboard-banner-sub">Here's a quick snapshot of your HR operations today.</p>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Stat Cards */}
        <div className="stat-cards-grid">
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
        <div className="bottom-grid">
          {/* Quick Actions */}
          <div className="panel">
            <div className="panel-header">
              <TrendingUp />
              <h3 className="panel-title">Quick Actions</h3>
            </div>
            {QUICK_ACTIONS.map((a) => (
              <ActionRow key={a.to} {...a} />
            ))}
          </div>

          {/* HR Modules */}
          <div className="panel">
            <div className="panel-header">
              <FileText />
              <h3 className="panel-title">HR Modules</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              {MODULES.map((m) => (
                <ModuleRow key={m.label} {...m} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
