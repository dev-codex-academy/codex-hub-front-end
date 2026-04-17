import React, { useEffect, useState } from 'react'
import {
  GraduationCap, Users, X, MapPin, Mail, Calendar,
  BookOpen, ExternalLink, Award, Star,
} from 'lucide-react'
import instructorService from '@/services/instructorService'

const ROLE_CONFIG = {
  'Instructor':         { label: 'Teacher',            color: '#7C3AED', bg: '#EDE9FE', accent: 'linear-gradient(135deg,#7C3AED,#6D28D9)' },
  'Teaching Assistant': { label: 'Teaching Assistant', color: '#059669', bg: '#D1FAE5', accent: 'linear-gradient(135deg,#059669,#047857)' },
}

const SKILL_LEVEL_COLOR = {
  expert:       { color: '#7C3AED', bg: '#EDE9FE' },
  advanced:     { color: '#1D4ED8', bg: '#DBEAFE' },
  intermediate: { color: '#065F46', bg: '#D1FAE5' },
  beginner:     { color: '#92400E', bg: '#FEF3C7' },
}

/* ── Avatar — photo or initials ───────────────────────────────── */
function Avatar({ person, size = 52, fontSize = 18 }) {
  const [imgError, setImgError] = useState(false)
  const initials = ((person.first_name?.[0] ?? '') + (person.last_name?.[0] ?? '')).toUpperCase()
  const role     = ROLE_CONFIG[person.position_title]

  if (person.photo_url && !imgError) {
    return (
      <img
        src={person.photo_url}
        alt={`${person.first_name} ${person.last_name}`}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.6)' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: role?.accent ?? 'linear-gradient(135deg,#3d6e98,#4E89BD)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, color: 'white',
      border: '3px solid rgba(255,255,255,0.3)',
    }}>
      {initials}
    </div>
  )
}

/* ── Profile Modal ────────────────────────────────────────────── */
function ProfileModal({ person, onClose }) {
  const role     = ROLE_CONFIG[person.position_title] ?? { label: person.position_title ?? 'Staff', color: '#4E89BD', bg: '#EFF6FF', accent: 'linear-gradient(135deg,#3d6e98,#4E89BD)' }
  const hireYear = person.hire_date ? new Date(person.hire_date).getFullYear() : null
  const skills   = person.skills ?? []

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#3d6e98 50%,#4E89BD 100%)', padding: '28px 24px 24px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <X size={15} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Avatar person={person} size={76} fontSize={26} />
            <div>
              <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'white', margin: '0 0 6px' }}>
                {person.first_name} {person.last_name}
              </h2>
              <span style={{ fontSize: '12px', fontWeight: 700, color: role.color, background: role.bg, padding: '3px 12px', borderRadius: '20px' }}>
                {role.label}
              </span>
              {person.notes && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', lineHeight: 1.5, maxWidth: '280px' }}>{person.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px' }}>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {person.position_title && <InfoRow Icon={BookOpen} label="Role" value={person.position_title} />}
            {(person.city || person.state) && (
              <InfoRow Icon={MapPin} label="Location" value={[person.city, person.state, person.country].filter(Boolean).join(', ')} />
            )}
            {hireYear && <InfoRow Icon={Calendar} label="CodeX member since" value={String(hireYear)} />}
            {person.email && <InfoRow Icon={Mail} label="Email" value={person.email} href={`mailto:${person.email}`} />}
          </div>

          {/* Calendly CTA */}
          {person.calendly_url && (
            <a
              href={person.calendly_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg,#006BFF,#0052CC)',
                color: 'white', textDecoration: 'none',
                borderRadius: '10px', padding: '11px 16px',
                fontSize: '14px', fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,107,255,0.3)',
                marginBottom: '20px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Calendar size={16} strokeWidth={2} />
              Schedule a Meeting
              <ExternalLink size={13} style={{ opacity: 0.8 }} />
            </a>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skills.map(s => {
                  const lvl = SKILL_LEVEL_COLOR[s.level] ?? SKILL_LEVEL_COLOR.intermediate
                  return (
                    <span key={s.id} style={{ fontSize: '12px', fontWeight: 600, color: lvl.color, background: lvl.bg, padding: '3px 10px', borderRadius: '20px' }}>
                      {s.skill_name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ Icon, label, value, href }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} strokeWidth={2} style={{ color: '#4E89BD' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>{label}</p>
        {href
          ? <a href={href} style={{ fontSize: '13px', color: '#4E89BD', fontWeight: 600, textDecoration: 'none' }}>{value}</a>
          : <p style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, margin: 0 }}>{value}</p>
        }
      </div>
    </div>
  )
}

/* ── Instructor Card ──────────────────────────────────────────── */
function InstructorCard({ person, onSelect }) {
  const role     = ROLE_CONFIG[person.position_title] ?? { label: person.position_title ?? 'Staff', color: '#4E89BD', bg: '#EFF6FF', accent: 'linear-gradient(135deg,#3d6e98,#4E89BD)' }
  const hireYear = person.hire_date ? new Date(person.hire_date).getFullYear() : null
  const skills   = (person.skills ?? []).slice(0, 3)

  return (
    <div
      onClick={() => onSelect(person)}
      style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Color accent top bar */}
      <div style={{ height: '5px', background: person.position_title === 'Instructor' ? 'linear-gradient(90deg,#7C3AED,#6D28D9)' : 'linear-gradient(90deg,#059669,#047857)' }} />

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
          <Avatar person={person} size={50} fontSize={17} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {person.first_name} {person.last_name}
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: role.color, background: role.bg, padding: '2px 8px', borderRadius: '20px' }}>
              {role.label}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
          {(person.city || person.state) && (
            <p style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
              <MapPin size={11} strokeWidth={2} /> {person.city}{person.state ? `, ${person.state}` : ''}
            </p>
          )}
          {hireYear && (
            <p style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
              <Calendar size={11} strokeWidth={2} /> Member since {hireYear}
            </p>
          )}
          {person.calendly_url && (
            <p style={{ fontSize: '12px', color: '#006BFF', display: 'flex', alignItems: 'center', gap: '5px', margin: 0, fontWeight: 600 }}>
              <Star size={11} strokeWidth={2} /> Schedule available
            </p>
          )}
        </div>

        {/* Skills preview */}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
            {skills.map(s => {
              const lvl = SKILL_LEVEL_COLOR[s.level] ?? SKILL_LEVEL_COLOR.intermediate
              return (
                <span key={s.id} style={{ fontSize: '11px', fontWeight: 600, color: lvl.color, background: lvl.bg, padding: '2px 8px', borderRadius: '20px' }}>
                  {s.skill_name}
                </span>
              )
            })}
            {(person.skills ?? []).length > 3 && (
              <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 6px' }}>+{(person.skills ?? []).length - 3} more</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: '#4E89BD', fontWeight: 700, margin: 0 }}>View profile →</p>
          {person.calendly_url && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#006BFF,#0052CC)', padding: '2px 8px', borderRadius: '20px', marginLeft: 'auto' }}>
              Calendly
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Section ──────────────────────────────────────────────────── */
function InstructorSection({ title, Icon, people, onSelect }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={14} style={{ color: '#4E89BD' }} /> {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {people.map(p => <InstructorCard key={p.id} person={p} onSelect={onSelect} />)}
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)

  useEffect(() => {
    instructorService.getAll()
      .then(res => setInstructors(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const teachers = instructors.filter(i => i.position_title === 'Instructor')
  const tas      = instructors.filter(i => i.position_title === 'Teaching Assistant')

  if (loading) return <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading…</p>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Meet Your Instructors</h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>The CodeX Academy team behind your learning journey</p>
      </div>

      {instructors.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '48px 24px', textAlign: 'center' }}>
          <Users size={36} strokeWidth={1.2} style={{ color: '#CBD5E1', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 700, fontSize: '15px', color: '#475569' }}>No instructors found</p>
        </div>
      ) : (
        <>
          {teachers.length > 0 && <InstructorSection title="Teachers" Icon={GraduationCap} people={teachers} onSelect={setSelected} />}
          {tas.length > 0      && <InstructorSection title="Teaching Assistants" Icon={Award} people={tas} onSelect={setSelected} />}
        </>
      )}

      {selected && <ProfileModal person={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
