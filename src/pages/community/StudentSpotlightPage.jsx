import React, { useEffect, useState } from 'react'
import { Plus, X, Star } from 'lucide-react'
import studentSpotlightService from '@/services/studentSpotlightService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Swal from 'sweetalert2'

const EMPTY_FORM = {
  instructor_name: '',
  fed_level: '',
  student_name: '',
  month: '',
  strengths: '',
  problem_solving: '',
  learning_contribution: '',
}

function SpotlightFormModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? {
    instructor_name: existing.instructor_name,
    fed_level: existing.fed_level,
    student_name: existing.student_name,
    month: existing.month,
    strengths: existing.strengths,
    problem_solving: existing.problem_solving,
    learning_contribution: existing.learning_contribution,
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let res
      if (existing) {
        res = await studentSpotlightService.update(existing.id, form)
      } else {
        res = await studentSpotlightService.create(form)
      }
      onSaved(res.data, !!existing)
      onClose()
    } catch {
      Swal.fire('Error', 'Could not save spotlight.', 'error')
    }
    setSaving(false)
  }

  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }
  const taStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const required = (label) => <><span>{label}</span><span style={{ color: '#E06C75' }}> *</span></>

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={18} style={{ color: '#D97706' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              {existing ? 'Edit Spotlight' : 'Student of the Month'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{required('Instructor Name')}</label>
              <Input value={form.instructor_name} onChange={set('instructor_name')} placeholder="e.g. Carlos Rivera" required />
            </div>
            <div>
              <label style={labelStyle}>{required('FED Level / Cohort')}</label>
              <Input value={form.fed_level} onChange={set('fed_level')} placeholder="e.g. FED-12" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>{required('Student Name')}</label>
              <Input value={form.student_name} onChange={set('student_name')} placeholder="Full name" required />
            </div>
            <div>
              <label style={labelStyle}>{required('Month')}</label>
              <Input type="month" value={form.month ? form.month.substring(0, 7) : ''} onChange={e => setForm(f => ({ ...f, month: e.target.value + '-01' }))} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{required('What were this student\'s greatest strengths this month?')}</label>
            <textarea value={form.strengths} onChange={set('strengths')} rows={3} placeholder="Describe the student's key strengths…" required style={taStyle} />
          </div>

          <div>
            <label style={labelStyle}>{required('How did they approach problem-solving?')}</label>
            <textarea value={form.problem_solving} onChange={set('problem_solving')} rows={3} placeholder="Describe how they tackled challenges…" required style={taStyle} />
          </div>

          <div>
            <label style={labelStyle}>{required('How did they contribute to the cohort\'s learning?')}</label>
            <textarea value={form.learning_contribution} onChange={set('learning_contribution')} rows={3} placeholder="Describe their contribution to the group…" required style={taStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save Changes' : 'Submit'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StudentSpotlightPage() {
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | spotlight object

  useEffect(() => {
    studentSpotlightService.getAll({ ordering: '-month' })
      .then(res => setSpotlights(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setSpotlights(prev => prev.map(s => s.id === saved.id ? saved : s))
    } else {
      setSpotlights(prev => [saved, ...prev])
    }
  }

  const handleDelete = async (id) => {
    const r = await Swal.fire({
      title: 'Delete this spotlight?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E06C75',
      confirmButtonText: 'Delete',
    })
    if (!r.isConfirmed) return
    try {
      await studentSpotlightService.remove(id)
      setSpotlights(prev => prev.filter(s => s.id !== id))
    } catch {
      Swal.fire('Error', 'Could not delete.', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Student Spotlights</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Monthly instructor feedback on outstanding students</p>
        </div>
        <Button onClick={() => setModal('create')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> New Spotlight
        </Button>
      </div>

      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading…</p>
      ) : spotlights.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Star size={36} strokeWidth={1.2} style={{ color: '#CBD5E1', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#475569', marginBottom: '8px' }}>No spotlights yet</p>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>Submit the first monthly spotlight for a standout student.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
          {spotlights.map(s => (
            <Card key={s.id} style={{ overflow: 'hidden' }}>
              <CardContent style={{ padding: '0' }}>
                <div style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Star size={18} fill="white" style={{ color: 'white', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '2px' }}>{s.student_name}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                      {s.fed_level} · {new Date(s.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Submitted by <strong style={{ color: '#475569' }}>{s.instructor_name}</strong></p>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strengths</p>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{s.strengths}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problem Solving</p>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{s.problem_solving}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cohort Contribution</p>
                    <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{s.learning_contribution}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                    <Button size="sm" variant="outline" onClick={() => setModal(s)}>Edit</Button>
                    <Button size="sm" variant="outline" style={{ color: '#E06C75', borderColor: '#E06C75' }} onClick={() => handleDelete(s.id)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <SpotlightFormModal
          existing={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
