import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  User, MapPin, Mail, Phone, Linkedin, Globe, Pencil, Plus, Trash2,
  Briefcase, GraduationCap, Zap, FileText, Upload, CheckCheck,
} from 'lucide-react'
import Swal from 'sweetalert2'
import applicantService from '@/services/applicantService'
import workExperienceService from '@/services/workExperienceService'
import educationService from '@/services/educationService'
import applicantSkillService from '@/services/applicantSkillService'
import skillService from '@/services/skillService'
import notificationService from '@/services/notificationService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

/* ── helpers ─────────────────────────────────────────────────── */
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
const DEGREE_TYPES = Object.keys(DEGREE_LABELS)

const LEVEL_COLORS = { beginner: 'default', intermediate: 'pending', advanced: 'approved', expert: 'hired' }

/* ── section header ──────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={18} strokeWidth={2} style={{ color: 'var(--blue)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
      </div>
      {action}
    </div>
  )
}

/* ── timeline item wrapper ───────────────────────────────────── */
function TimelineItem({ children, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: '4px',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
        <div style={{ flex: 1, width: '2px', background: 'var(--border)', marginTop: '4px' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {onEdit && (
          <button onClick={onEdit} style={ghostBtn}>
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} style={{ ...ghostBtn, color: 'var(--red)' }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '5px',
  borderRadius: '6px', color: 'var(--text-muted)', display: 'flex',
  alignItems: 'center', transition: 'background 0.15s',
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [workExp, setWorkExp] = useState([])
  const [education, setEducation] = useState([])
  const [mySkills, setMySkills] = useState([])
  const [skillCatalog, setSkillCatalog] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [workModal, setWorkModal] = useState({ open: false, item: null })
  const [eduModal, setEduModal] = useState({ open: false, item: null })
  const [skillModal, setSkillModal] = useState(false)

  const cvInputRef = useRef(null)

  const profileForm = useForm()
  const workForm = useForm()
  const eduForm = useForm()
  const skillForm = useForm()

  /* ── fetch ── */
  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await applicantService.getMyProfile()
      const p = res.data
      setProfile(p)
      setWorkExp(p.work_experiences ?? [])

      const [eduRes, skillsRes, catalogRes, notifRes] = await Promise.all([
        educationService.getAll({ applicant: p.id }),
        applicantSkillService.getAll({ applicant: p.id }),
        skillService.getAll(),
        notificationService.getAll({ applicant: p.id, is_read: false }),
      ])
      setEducation(eduRes.data.results ?? eduRes.data)
      setMySkills(skillsRes.data.results ?? skillsRes.data)
      setSkillCatalog(catalogRes.data.results ?? catalogRes.data)
      setNotifications(notifRes.data.results ?? notifRes.data)
    } catch (err) {
      // 404 means no applicant profile linked — show empty state, not an error
      if (err.response?.status !== 404) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load your profile.', confirmButtonColor: '#4E89BD' })
      }
      // profile stays null → renders the "no profile found" state below
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  /* ── edit profile ── */
  const openEditProfile = () => {
    profileForm.reset({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      headline: profile.headline,
      summary: profile.summary,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      city: profile.city,
      state: profile.state,
      country: profile.country,
    })
    setEditProfileOpen(true)
  }

  const onSaveProfile = async (data) => {
    setSaving(true)
    try {
      await applicantService.updateMyProfile(data)
      setEditProfileOpen(false)
      loadProfile()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to save.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  /* ── photo upload ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await applicantService.uploadMyPhoto(profile.id, file)
      loadProfile()
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not upload photo.', confirmButtonColor: '#4E89BD' })
    }
  }

  /* ── CV upload ── */
  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await applicantService.uploadMyCV(profile.id, file)
      loadProfile()
      Swal.fire({ icon: 'success', title: 'CV uploaded', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not upload CV.', confirmButtonColor: '#4E89BD' })
    }
  }

  /* ── work experience ── */
  const openNewWork = () => { workForm.reset({}); setWorkModal({ open: true, item: null }) }
  const openEditWork = (item) => {
    workForm.reset({
      company: item.company, title: item.title, location: item.location,
      start_date: item.start_date, end_date: item.end_date ?? '',
      is_current: item.is_current, description: item.description,
    })
    setWorkModal({ open: true, item })
  }
  const onSaveWork = async (data) => {
    setSaving(true)
    try {
      const payload = { ...data, applicant: profile.id, end_date: data.end_date || null }
      if (workModal.item) {
        await workExperienceService.update(workModal.item.id, payload)
      } else {
        await workExperienceService.create(payload)
      }
      setWorkModal({ open: false, item: null })
      loadProfile()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to save.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }
  const deleteWork = async (item) => {
    const r = await Swal.fire({ title: 'Remove experience?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Remove' })
    if (r.isConfirmed) {
      await workExperienceService.remove(item.id)
      loadProfile()
    }
  }

  /* ── education ── */
  const openNewEdu = () => { eduForm.reset({}); setEduModal({ open: true, item: null }) }
  const openEditEdu = (item) => {
    eduForm.reset({
      institution: item.institution, degree_type: item.degree_type,
      field_of_study: item.field_of_study, start_date: item.start_date,
      end_date: item.end_date ?? '', is_current: item.is_current,
      gpa: item.gpa ?? '', description: item.description,
    })
    setEduModal({ open: true, item })
  }
  const onSaveEdu = async (data) => {
    setSaving(true)
    try {
      const payload = { ...data, applicant: profile.id, end_date: data.end_date || null, gpa: data.gpa || null }
      if (eduModal.item) {
        await educationService.update(eduModal.item.id, payload)
      } else {
        await educationService.create(payload)
      }
      setEduModal({ open: false, item: null })
      loadProfile()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to save.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }
  const deleteEdu = async (item) => {
    const r = await Swal.fire({ title: 'Remove education?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Remove' })
    if (r.isConfirmed) {
      await educationService.remove(item.id)
      loadProfile()
    }
  }

  /* ── skills ── */
  const onAddSkill = async (data) => {
    setSaving(true)
    try {
      await applicantSkillService.create({ ...data, applicant: profile.id })
      setSkillModal(false)
      skillForm.reset({})
      loadProfile()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to add skill.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }
  const removeSkill = async (as) => {
    await applicantSkillService.remove(as.id)
    loadProfile()
  }

  /* ── notifications ── */
  const markAllRead = async () => {
    if (!profile) return
    await notificationService.markAllRead(profile.id)
    loadProfile()
  }

  /* ── render ── */
  if (loading) return <div style={{ position: 'relative', height: '300px' }}><SpinnerOverlay /></div>
  if (!profile) return (
    <div style={{ padding: '80px 40px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'var(--blue-pale)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <User size={28} strokeWidth={1.5} style={{ color: 'var(--blue)' }} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        No applicant profile linked
      </h3>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        This page is for applicant accounts. Your administrator account is not linked to an applicant profile.
        <br /><br />
        To test the applicant experience, <strong>register a new account</strong> via the{' '}
        <a href="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>Register page</a>{' '}
        and log in with that account.
      </p>
    </div>
  )

  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
  const unread = notifications.length

  return (
    <div className="page" style={{ maxWidth: '820px' }}>

      {/* ── Unread notifications banner ── */}
      {unread > 0 && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-lg)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)' }}>
            <CheckCheck size={16} strokeWidth={2} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              You have {unread} unread notification{unread > 1 ? 's' : ''}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>
        </div>
      )}

      {/* ── Profile header ── */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
              />
            ) : (
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4E89BD, #61AFEE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {initials}
              </div>
            )}
            {/* Photo upload overlay */}
            <label style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--blue)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid white',
            }}>
              <Upload size={11} strokeWidth={2.5} />
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </label>
          </div>

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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
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

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <Button size="sm" onClick={openEditProfile}>
              <Pencil className="h-4 w-4 mr-1" /> Edit Profile
            </Button>
            <Button size="sm" variant="outline" onClick={() => cvInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-1" /> {profile.has_cv ? 'Replace CV' : 'Upload CV'}
            </Button>
            <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCVUpload} />
            {profile.has_cv && (
              <Button size="sm" variant="outline" onClick={() => applicantService.downloadCV(profile.id).then(r => window.open(r.data.download_url))}>
                Download CV
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        {profile.summary && (
          <p style={{ marginTop: '18px', fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            {profile.summary}
          </p>
        )}
      </div>

      {/* ── Work Experience ── */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={Briefcase}
          title="Work Experience"
          action={
            <Button size="sm" variant="outline" onClick={openNewWork}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          }
        />
        {workExp.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Add your work history to stand out to employers.
          </p>
        ) : workExp.map(w => (
          <TimelineItem key={w.id} onEdit={() => openEditWork(w)} onDelete={() => deleteWork(w)}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{w.title}</p>
            <p style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600, marginTop: '2px' }}>{w.company}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {fmtPeriod(w.start_date, w.end_date, w.is_current)}
              {w.location ? ` · ${w.location}` : ''}
            </p>
            {w.description && (
              <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.6 }}>{w.description}</p>
            )}
          </TimelineItem>
        ))}
      </div>

      {/* ── Education ── */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={GraduationCap}
          title="Education"
          action={
            <Button size="sm" variant="outline" onClick={openNewEdu}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          }
        />
        {education.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Add your education background.
          </p>
        ) : education.map(e => (
          <TimelineItem key={e.id} onEdit={() => openEditEdu(e)} onDelete={() => deleteEdu(e)}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{e.institution}</p>
            <p style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600, marginTop: '2px' }}>
              {DEGREE_LABELS[e.degree_type] || e.degree_type}
              {e.field_of_study ? ` · ${e.field_of_study}` : ''}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {fmtPeriod(e.start_date, e.end_date, e.is_current)}
              {e.gpa ? ` · GPA ${e.gpa}` : ''}
            </p>
            {e.description && (
              <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.6 }}>{e.description}</p>
            )}
          </TimelineItem>
        ))}
      </div>

      {/* ── Skills ── */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={Zap}
          title="Skills"
          action={
            <Button size="sm" variant="outline" onClick={() => { skillForm.reset({}); setSkillModal(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Add Skill
            </Button>
          }
        />
        {mySkills.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Add skills to show your expertise.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {mySkills.map(as => (
              <div key={as.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px 5px 12px', borderRadius: '20px',
                border: '1px solid var(--border)', background: '#f8fafc',
                fontSize: '13px', fontWeight: 500,
              }}>
                <span>{as.skill_name}</span>
                <Badge variant={LEVEL_COLORS[as.level] || 'default'} style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {as.level}
                </Badge>
                <button
                  onClick={() => removeSkill(as)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '0 0 0 2px', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* Edit Profile modal */}
      <FormModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        title="Edit Profile"
        onSubmit={profileForm.handleSubmit(onSaveProfile)}
        loading={saving}
      >
        <div className="form-grid-2">
          <div className="form-group">
            <Label>First Name *</Label>
            <Input {...profileForm.register('first_name', { required: 'Required' })} />
            {profileForm.formState.errors.first_name && <p className="form-error">{profileForm.formState.errors.first_name.message}</p>}
          </div>
          <div className="form-group">
            <Label>Last Name *</Label>
            <Input {...profileForm.register('last_name', { required: 'Required' })} />
            {profileForm.formState.errors.last_name && <p className="form-error">{profileForm.formState.errors.last_name.message}</p>}
          </div>
        </div>
        <div className="form-group">
          <Label>Headline</Label>
          <Input {...profileForm.register('headline')} placeholder="e.g. Full Stack Developer with 3 years experience" />
        </div>
        <div className="form-group">
          <Label>Summary</Label>
          <textarea {...profileForm.register('summary')} rows={3} className="form-textarea" placeholder="Brief professional summary..." />
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Phone</Label>
            <Input {...profileForm.register('phone')} placeholder="+1 555 000 0000" />
          </div>
          <div className="form-group">
            <Label>City</Label>
            <Input {...profileForm.register('city')} placeholder="San Francisco" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>State / Province</Label>
            <Input {...profileForm.register('state')} placeholder="CA" />
          </div>
          <div className="form-group">
            <Label>Country</Label>
            <Input {...profileForm.register('country')} placeholder="US" />
          </div>
        </div>
        <div className="form-group">
          <Label>LinkedIn URL</Label>
          <Input {...profileForm.register('linkedin_url')} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="form-group">
          <Label>Portfolio / Website</Label>
          <Input {...profileForm.register('portfolio_url')} placeholder="https://..." />
        </div>
      </FormModal>

      {/* Work Experience modal */}
      <FormModal
        open={workModal.open}
        onOpenChange={(v) => setWorkModal(m => ({ ...m, open: v }))}
        title={workModal.item ? 'Edit Experience' : 'Add Work Experience'}
        onSubmit={workForm.handleSubmit(onSaveWork)}
        loading={saving}
      >
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Company *</Label>
            <Input {...workForm.register('company', { required: 'Required' })} placeholder="Google" />
            {workForm.formState.errors.company && <p className="form-error">{workForm.formState.errors.company.message}</p>}
          </div>
          <div className="form-group">
            <Label>Job Title *</Label>
            <Input {...workForm.register('title', { required: 'Required' })} placeholder="Software Engineer" />
            {workForm.formState.errors.title && <p className="form-error">{workForm.formState.errors.title.message}</p>}
          </div>
        </div>
        <div className="form-group">
          <Label>Location</Label>
          <Input {...workForm.register('location')} placeholder="Remote · New York, NY" />
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Start Date *</Label>
            <Input type="date" {...workForm.register('start_date', { required: 'Required' })} />
            {workForm.formState.errors.start_date && <p className="form-error">{workForm.formState.errors.start_date.message}</p>}
          </div>
          <div className="form-group">
            <Label>End Date</Label>
            <Input type="date" {...workForm.register('end_date')} />
          </div>
        </div>
        <div className="form-check">
          <input type="checkbox" id="work_is_current" {...workForm.register('is_current')} className="h-4 w-4" />
          <Label htmlFor="work_is_current">I currently work here</Label>
        </div>
        <div className="form-group">
          <Label>Description</Label>
          <textarea {...workForm.register('description')} rows={3} className="form-textarea" placeholder="Describe your responsibilities and achievements..." />
        </div>
      </FormModal>

      {/* Education modal */}
      <FormModal
        open={eduModal.open}
        onOpenChange={(v) => setEduModal(m => ({ ...m, open: v }))}
        title={eduModal.item ? 'Edit Education' : 'Add Education'}
        onSubmit={eduForm.handleSubmit(onSaveEdu)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Institution *</Label>
          <Input {...eduForm.register('institution', { required: 'Required' })} placeholder="MIT, Platzi, Coursera..." />
          {eduForm.formState.errors.institution && <p className="form-error">{eduForm.formState.errors.institution.message}</p>}
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Degree Type</Label>
            <select {...eduForm.register('degree_type')} className="form-select">
              {DEGREE_TYPES.map(d => <option key={d} value={d}>{DEGREE_LABELS[d]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <Label>Field of Study</Label>
            <Input {...eduForm.register('field_of_study')} placeholder="Computer Science" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Start Date *</Label>
            <Input type="date" {...eduForm.register('start_date', { required: 'Required' })} />
            {eduForm.formState.errors.start_date && <p className="form-error">{eduForm.formState.errors.start_date.message}</p>}
          </div>
          <div className="form-group">
            <Label>End Date</Label>
            <Input type="date" {...eduForm.register('end_date')} />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-check">
            <input type="checkbox" id="edu_is_current" {...eduForm.register('is_current')} className="h-4 w-4" />
            <Label htmlFor="edu_is_current">Currently enrolled</Label>
          </div>
          <div className="form-group">
            <Label>GPA</Label>
            <Input type="number" step="0.01" min="0" max="4" {...eduForm.register('gpa')} placeholder="3.8" />
          </div>
        </div>
        <div className="form-group">
          <Label>Description</Label>
          <textarea {...eduForm.register('description')} rows={2} className="form-textarea" placeholder="Honors, thesis, relevant coursework..." />
        </div>
      </FormModal>

      {/* Add Skill modal */}
      <FormModal
        open={skillModal}
        onOpenChange={setSkillModal}
        title="Add Skill"
        onSubmit={skillForm.handleSubmit(onAddSkill)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Skill *</Label>
          <select {...skillForm.register('skill', { required: 'Required' })} className="form-select">
            <option value="">— Select a skill —</option>
            {skillCatalog
              .filter(s => !mySkills.some(ms => ms.skill === s.id))
              .map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
          </select>
          {skillForm.formState.errors.skill && <p className="form-error">{skillForm.formState.errors.skill.message}</p>}
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Proficiency Level</Label>
            <select {...skillForm.register('level')} className="form-select">
              {['beginner', 'intermediate', 'advanced', 'expert'].map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Label>Years of Experience</Label>
            <Input type="number" min={0} {...skillForm.register('years_of_experience')} placeholder="e.g. 3" />
          </div>
        </div>
      </FormModal>

    </div>
  )
}
