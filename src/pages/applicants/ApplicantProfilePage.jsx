import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Mail, Phone, Linkedin, Globe,
  Briefcase, GraduationCap, Zap, FileText, User,
} from 'lucide-react'
import applicantService from '@/services/applicantService'
import workExperienceService from '@/services/workExperienceService'
import educationService from '@/services/educationService'
import applicantSkillService from '@/services/applicantSkillService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpinnerOverlay } from '@/components/ui/spinner'

/* ── helpers ── */
const fmtPeriod = (start, end, isCurrent) => {
  if (!start) return '—'
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const e = isCurrent ? 'Present' : (end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—')
  return `${s} – ${e}`
}

const DEGREE_LABELS = {
  high_school: 'High School', associate: 'Associate', bachelor: "Bachelor's",
  master: "Master's", doctorate: 'Doctorate / PhD', bootcamp: 'Bootcamp',
  certification: 'Certification', other: 'Other',
}

const LEVEL_COLORS = { beginner: 'default', intermediate: 'pending', advanced: 'approved', expert: 'hired' }
const CATEGORY_COLORS = { technical: 'approved', soft: 'pending', language: 'warning', tool: 'default', other: 'default' }

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <Icon size={17} strokeWidth={2} style={{ color: 'var(--blue)' }} />
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
    </div>
  )
}

function TimelineEntry({ children }) {
  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ width: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
        <div style={{ flex: 1, width: '2px', background: 'var(--border)', marginTop: '4px' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

export default function ApplicantProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile]   = useState(null)
  const [workExp, setWorkExp]   = useState([])
  const [education, setEdu]     = useState([])
  const [skills, setSkills]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [profRes, workRes, eduRes, skillRes] = await Promise.all([
          applicantService.getById(id),
          workExperienceService.getAll({ applicant: id }),
          educationService.getAll({ applicant: id }),
          applicantSkillService.getAll({ applicant: id }),
        ])
        setProfile(profRes.data)
        setWorkExp(workRes.data.results ?? workRes.data)
        setEdu(eduRes.data.results ?? eduRes.data)
        setSkills(skillRes.data.results ?? skillRes.data)
      } catch {
        navigate('/applicants')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div style={{ position: 'relative', height: '300px' }}><SpinnerOverlay /></div>
  if (!profile) return null

  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="page" style={{ maxWidth: '820px' }}>

      {/* Back */}
      <div>
        <Link to="/applicants" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back to Applicants
        </Link>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name}
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '84px', height: '84px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #4E89BD, #61AFEE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontWeight: 700, color: 'white',
            }}>{initials}</div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>{profile.full_name}</h2>
            {profile.headline && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{profile.headline}</p>
            )}
            {(profile.city || profile.country) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <MapPin size={13} />
                <span>{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
              {profile.email && (
                <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--blue)' }}>
                  <Mail size={12} />{profile.email}
                </a>
              )}
              {profile.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Phone size={12} />{profile.phone}
                </span>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--blue)' }}>
                  <Linkedin size={12} />LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--blue)' }}>
                  <Globe size={12} />Portfolio
                </a>
              )}
            </div>
          </div>

          {/* HR Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <Button size="sm" onClick={() => navigate(`/job-applications?applicant=${profile.id}`)}>
              <FileText className="h-4 w-4 mr-1" /> View Applications
            </Button>
            {profile.has_cv && (
              <Button size="sm" variant="outline"
                onClick={() => applicantService.downloadCV(profile.id).then(r => window.open(r.data.download_url))}>
                Download CV
              </Button>
            )}
          </div>
        </div>

        {profile.summary && (
          <p style={{ marginTop: '18px', fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            {profile.summary}
          </p>
        )}
      </div>

      {/* Work Experience */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader icon={Briefcase} title="Work Experience" />
        {workExp.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No work experience on record.</p>
        ) : workExp.map(w => (
          <TimelineEntry key={w.id}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{w.title}</p>
            <p style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600, marginTop: '2px' }}>{w.company}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {fmtPeriod(w.start_date, w.end_date, w.is_current)}{w.location ? ` · ${w.location}` : ''}
            </p>
            {w.description && (
              <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.6 }}>{w.description}</p>
            )}
          </TimelineEntry>
        ))}
      </div>

      {/* Education */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader icon={GraduationCap} title="Education" />
        {education.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No education records on file.</p>
        ) : education.map(e => (
          <TimelineEntry key={e.id}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{e.institution}</p>
            <p style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600, marginTop: '2px' }}>
              {DEGREE_LABELS[e.degree_type] || e.degree_type}{e.field_of_study ? ` · ${e.field_of_study}` : ''}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {fmtPeriod(e.start_date, e.end_date, e.is_current)}{e.gpa ? ` · GPA ${e.gpa}` : ''}
            </p>
            {e.description && (
              <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.6 }}>{e.description}</p>
            )}
          </TimelineEntry>
        ))}
      </div>

      {/* Skills */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader icon={Zap} title="Skills" />
        {skills.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No skills listed.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map(as => (
              <div key={as.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '20px',
                border: '1px solid var(--border)', background: '#f8fafc',
                fontSize: '13px', fontWeight: 500,
              }}>
                <span>{as.skill_name}</span>
                <Badge variant={LEVEL_COLORS[as.level] || 'default'} style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {as.level}
                </Badge>
                {as.years_of_experience && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{as.years_of_experience}y</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
