import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  MapPin, Mail, Calendar, BookOpen, Pencil, X, Save,
  Camera, Link2, Plus, Trash2,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '@/context/AuthContext'
import employeeService from '@/services/employeeService'
import skillService from '@/services/skillService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ROLE_BADGE = {
  'Instructor':         { label: 'Teacher',            color: '#7C3AED', bg: '#EDE9FE' },
  'Teaching Assistant': { label: 'Teaching Assistant', color: '#16A34A', bg: '#F0FDF4' },
}

const LEVEL_COLORS = {
  beginner:     { color: '#92400E', bg: '#FEF3C7' },
  intermediate: { color: '#1D4ED8', bg: '#DBEAFE' },
  advanced:     { color: '#065F46', bg: '#D1FAE5' },
  expert:       { color: '#6D28D9', bg: '#EDE9FE' },
}

function InfoRow({ Icon, label, value, href }) {
  if (!value) return null
  const text = href
    ? <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#4E89BD', fontWeight: 500, textDecoration: 'none' }}>{value}</a>
    : <p style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>{value}</p>
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} strokeWidth={2} style={{ color: '#4E89BD' }} />
      </div>
      <div>
        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</p>
        {text}
      </div>
    </div>
  )
}

export default function InstructorProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Skills state
  const [allSkills, setAllSkills]   = useState([])
  const [mySkills, setMySkills]     = useState([])
  const [addSkillId, setAddSkillId] = useState('')
  const [addLevel, setAddLevel]     = useState('intermediate')
  const [skillSaving, setSkillSaving] = useState(false)

  const photoInputRef = useRef(null)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    employeeService.getMe()
      .then(res => { setProfile(res.data); reset(res.data); setMySkills(res.data.skills ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
    skillService.getAll()
      .then(res => setAllSkills(res.data?.results ?? res.data ?? []))
      .catch(() => {})
  }, [])

  const onSave = async (data) => {
    try {
      const res = await employeeService.updateMe({
        phone:        data.phone,
        city:         data.city,
        state:        data.state,
        country:      data.country,
        notes:        data.notes,
        calendly_url: data.calendly_url,
      })
      setProfile(res.data)
      setEditing(false)
      Swal.fire({ icon: 'success', title: 'Profile updated!', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire('Error', 'Could not save changes.', 'error')
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const res = await employeeService.uploadPhoto(file)
      setProfile(prev => ({ ...prev, photo_url: res.data.photo_url }))
    } catch {
      Swal.fire('Error', 'Could not upload photo.', 'error')
    }
    setUploadingPhoto(false)
    e.target.value = ''
  }

  const handleAddSkill = async () => {
    if (!addSkillId) return
    setSkillSaving(true)
    try {
      const res = await employeeService.addMySkill(addSkillId, addLevel)
      setMySkills(prev => {
        const existing = prev.find(s => s.id === res.data.id)
        return existing ? prev.map(s => s.id === res.data.id ? res.data : s) : [...prev, res.data]
      })
      setAddSkillId('')
    } catch {
      Swal.fire('Error', 'Could not add skill.', 'error')
    }
    setSkillSaving(false)
  }

  const handleRemoveSkill = async (skillEntryId) => {
    try {
      await employeeService.removeMySkill(skillEntryId)
      setMySkills(prev => prev.filter(s => s.id !== skillEntryId))
    } catch {
      Swal.fire('Error', 'Could not remove skill.', 'error')
    }
  }

  if (loading) return <p style={{ color: '#94A3B8', padding: '40px 0' }}>Loading profile…</p>

  if (!profile) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
      <p>No employee profile found. Contact an administrator.</p>
    </div>
  )

  const initials  = ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase()
  const badge     = ROLE_BADGE[profile.position_title] ?? { label: profile.position_title ?? 'Instructor', color: '#4E89BD', bg: '#EFF6FF' }
  const hireYear  = profile.hire_date ? new Date(profile.hire_date).getFullYear() : null
  const location  = [profile.city, profile.state, profile.country !== 'US' ? profile.country : null].filter(Boolean).join(', ')

  const usedSkillIds = new Set(mySkills.map(s => s.skill))
  const availableSkills = allSkills.filter(s => !usedSkillIds.has(s.id))

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Hero card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3d6e98 0%, #4E89BD 60%, #61AFEE 100%)', height: '100px' }} />
        <div style={{ padding: '0 28px 24px', position: 'relative' }}>

          {/* Avatar / photo */}
          <div style={{ position: 'absolute', top: '-40px', left: '28px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={initials}
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', display: 'block' }}
                />
              ) : null}
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3d6e98, #4E89BD)', display: profile.photo_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: 'white', border: '4px solid white' }}>
                {initials}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Change photo"
                style={{ position: 'absolute', bottom: '2px', right: '2px', width: '24px', height: '24px', borderRadius: '50%', background: '#4E89BD', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Camera size={11} style={{ color: 'white' }} />
              </button>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </div>
          </div>

          {/* Edit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', marginBottom: '8px' }}>
            {editing ? (
              <button onClick={() => { setEditing(false); reset(profile) }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#64748B' }}>
                <X size={14} /> Cancel
              </button>
            ) : (
              <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#4E89BD' }}>
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>

          {/* Name + role */}
          <div style={{ marginTop: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
              {profile.first_name} {profile.last_name}
            </h1>
            <span style={{ fontSize: '12px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '3px 10px', borderRadius: '20px' }}>
              {badge.label}
            </span>
          </div>

          {/* Bio */}
          <div style={{ marginTop: '16px' }}>
            {editing ? (
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Write a short bio — your background, teaching style, what you love about coding…"
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#475569', boxSizing: 'border-box' }}
              />
            ) : (
              profile.notes
                ? <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>{profile.notes}</p>
                : <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No bio yet — click "Edit Profile" to add one.</p>
            )}
          </div>
        </div>
      </div>

      {/* Details card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Contact & Info</h2>

        {editing ? (
          <form onSubmit={handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>City</label>
                <Input {...register('city')} placeholder="Austin" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>State</label>
                <Input {...register('state')} placeholder="TX" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Country</label>
                <Input {...register('country')} placeholder="US" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Calendly URL</label>
              <Input {...register('calendly_url')} placeholder="https://calendly.com/your-link" />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <Button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={14} /> {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: '4px' }}>
            <InfoRow Icon={BookOpen}  label="Position"       value={profile.position_title} />
            <InfoRow Icon={Mail}      label="Email"           value={profile.email} />
            <InfoRow Icon={MapPin}    label="Location"        value={location} />
            <InfoRow Icon={Calendar}  label="CodeX member since" value={hireYear ? String(hireYear) : null} />
            <InfoRow Icon={Link2}     label="Calendly"       value={profile.calendly_url || null} href={profile.calendly_url || null} />
          </div>
        )}
      </div>

      {/* Skills card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Skills</h2>

        {/* Existing skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: mySkills.length ? '16px' : '0' }}>
          {mySkills.map(s => {
            const lc = LEVEL_COLORS[s.level] ?? LEVEL_COLORS.intermediate
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: lc.bg, border: `1px solid ${lc.color}22`, borderRadius: '20px', padding: '4px 10px 4px 12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: lc.color }}>{s.skill_name}</span>
                <span style={{ fontSize: '11px', color: lc.color, opacity: 0.75 }}>· {s.level}</span>
                <button onClick={() => handleRemoveSkill(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center', color: lc.color, opacity: 0.6 }}>
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
          {mySkills.length === 0 && (
            <p style={{ fontSize: '14px', color: '#94A3B8', fontStyle: 'italic' }}>No skills added yet.</p>
          )}
        </div>

        {/* Add skill row */}
        {availableSkills.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
            <select
              value={addSkillId}
              onChange={e => setAddSkillId(e.target.value)}
              style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#475569', outline: 'none', background: 'white' }}
            >
              <option value="">Select a skill…</option>
              {availableSkills.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
            <select
              value={addLevel}
              onChange={e => setAddLevel(e.target.value)}
              style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#475569', outline: 'none', background: 'white' }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <Button onClick={handleAddSkill} disabled={!addSkillId || skillSaving} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Plus size={14} /> Add
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
