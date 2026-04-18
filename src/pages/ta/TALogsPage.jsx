import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Clock, BookCheck, Users, Plus, X, Save, Trash2, Filter, Search, Loader2,
} from 'lucide-react'
import Swal from 'sweetalert2'
import taService from '@/services/taService'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/* ── helpers ─────────────────────────────────────────────────── */
function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}

function fmt(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_BADGE = {
  class_hours: { label: 'Class',       color: '#1D4ED8', bg: '#DBEAFE' },
  task_review: { label: 'Task Review', color: '#065F46', bg: '#D1FAE5' },
}

const lStyle = { fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }
const iStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }

/* ── Student search input ─────────────────────────────────────── */
function StudentSearch({ value, selectedName, onChange }) {
  const [inputVal,  setInputVal]  = useState(selectedName ?? '')
  const [options,   setOptions]   = useState([])
  const [open,      setOpen]      = useState(false)
  const [searching, setSearching] = useState(false)
  const [touched,   setTouched]   = useState(false)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  useEffect(() => { if (selectedName) setInputVal(selectedName) }, [selectedName])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback((text) => {
    if (!text.trim()) { setOptions([]); setOpen(false); return }
    setSearching(true)
    applicantService.getAll({ search: text, page_size: 15, ordering: 'last_name' })
      .then(res => {
        const list = res.data?.results ?? res.data ?? []
        setOptions(list)
        setOpen(list.length > 0)
      })
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [])

  const handleInput = (e) => {
    const text = e.target.value
    setInputVal(text)
    onChange(null, '')
    clearTimeout(timerRef.current)
    if (text.trim().length >= 2) {
      timerRef.current = setTimeout(() => doSearch(text), 350)
    } else {
      setOptions([])
      setOpen(false)
    }
  }

  const select = (s) => {
    setInputVal(s.full_name)
    onChange(s.id, s.full_name)
    setOptions([])
    setOpen(false)
  }

  const isSelected = !!value

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{
          position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
          color: isSelected ? '#4E89BD' : '#94A3B8', pointerEvents: 'none', flexShrink: 0,
        }} />
        <input
          value={inputVal}
          onChange={handleInput}
          onFocus={() => { setTouched(true); if (options.length) setOpen(true) }}
          placeholder="Type at least 2 characters to search…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          style={{
            ...iStyle,
            paddingLeft: '34px',
            paddingRight: '32px',
            borderColor: isSelected ? '#4E89BD' : (touched && !value ? '#F87171' : '#E2E8F0'),
            background: isSelected ? '#EFF6FF' : 'white',
          }}
        />
        {searching && (
          <Loader2 size={14} className="animate-spin" style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            color: '#94A3B8',
          }} />
        )}
      </div>

      {touched && !isSelected && inputVal.length > 0 && inputVal.length < 2 && (
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Type at least 2 characters…</p>
      )}
      {touched && !isSelected && inputVal.length === 0 && (
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Start typing a student name to search</p>
      )}

      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
          maxHeight: '240px', overflowY: 'auto',
        }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', padding: '8px 12px 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {options.length} result{options.length !== 1 ? 's' : ''}
          </p>
          {options.map(s => (
            <div key={s.id} onMouseDown={() => select(s)}
              style={{ padding: '9px 12px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {(s.full_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: '13px' }}>{s.full_name}</p>
                {s.email && <p style={{ color: '#94A3B8', fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {searching && inputVal.length >= 2 && !open && (
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Searching…</p>
      )}
    </div>
  )
}

/* ── Hours Modal ─────────────────────────────────────────────── */
function HoursModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    log_type:   initial?.log_type   ?? 'class_hours',
    cohort:     initial?.cohort     ?? '',
    date:       initial?.date       ?? '',
    start_time: initial?.start_time ?? '',
    end_time:   initial?.end_time   ?? '',
    notes:      initial?.notes      ?? '',
  })
  const [saving, setSaving] = useState(false)
  const total = calcHours(form.start_time, form.end_time)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = initial?.id
        ? await taService.updateHoursLog(initial.id, form)
        : await taService.createHoursLog(form)
      onSaved(res.data, !!initial?.id)
      onClose()
    } catch {
      Swal.fire('Error', 'Could not save log.', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: 0 }}>{initial?.id ? 'Edit Log' : 'Log Hours'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={lStyle}>Type</label>
            <select value={form.log_type} onChange={e => setForm(f => ({ ...f, log_type: e.target.value }))} style={iStyle}>
              <option value="class_hours">Class Hours</option>
              <option value="task_review">Task Review</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lStyle}>Cohort</label>
              <Input value={form.cohort} onChange={e => setForm(f => ({ ...f, cohort: e.target.value }))} placeholder="e.g. FED-2025-A" required />
            </div>
            <div>
              <label style={lStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required style={iStyle} />
            </div>
          </div>
          {total > 0 && (
            <div style={{ background: '#EFF6FF', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#1D4ED8', fontWeight: 600 }}>
              Total: {total.toFixed(2)} hrs
            </div>
          )}
          <div>
            <label style={lStyle}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Any observations…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}><Save size={14} style={{ marginRight: 5 }} />{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Mentorship Modal ────────────────────────────────────────── */
function MentorshipModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    cohort:      initial?.cohort     ?? '',
    student:     initial?.student    ?? '',
    studentName: initial?.student_name ?? '',
    date:        initial?.date       ?? '',
    start_time:  initial?.start_time ?? '',
    end_time:    initial?.end_time   ?? '',
    notes:       initial?.notes      ?? '',
  })
  const [saving, setSaving] = useState(false)
  const total = calcHours(form.start_time, form.end_time)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.student) { Swal.fire('Required', 'Please select a student.', 'warning'); return }
    setSaving(true)
    try {
      const { studentName, ...payload } = form
      const res = initial?.id
        ? await taService.updateMentorship(initial.id, payload)
        : await taService.createMentorship(payload)
      onSaved(res.data, !!initial?.id)
      onClose()
    } catch {
      Swal.fire('Error', 'Could not save mentorship.', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: 0 }}>{initial?.id ? 'Edit Mentorship' : 'New Mentorship'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lStyle}>Cohort</label>
              <Input value={form.cohort} onChange={e => setForm(f => ({ ...f, cohort: e.target.value }))} placeholder="e.g. FED-2025-A" required />
            </div>
            <div>
              <label style={lStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={iStyle} />
            </div>
          </div>
          <div>
            <label style={lStyle}>Student</label>
            <StudentSearch
              value={form.student}
              selectedName={form.studentName}
              onChange={(id, name) => setForm(f => ({ ...f, student: id ?? '', studentName: name ?? '' }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lStyle}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required style={iStyle} />
            </div>
            <div>
              <label style={lStyle}>End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required style={iStyle} />
            </div>
          </div>
          {total > 0 && (
            <div style={{ background: '#F0FDF4', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#065F46', fontWeight: 600 }}>
              Total: {total.toFixed(2)} hrs
            </div>
          )}
          <div>
            <label style={lStyle}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Any observations…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}><Save size={14} style={{ marginRight: 5 }} />{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────── */
export default function TALogsPage() {
  const [hoursLogs,   setHoursLogs]   = useState([])
  const [mentorships, setMentorships] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [modal,       setModal]       = useState(null) // 'hours' | 'mentorship'
  const [editing,     setEditing]     = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = { ordering: '-date', page_size: 200 }
    if (dateFrom) params.date_from = dateFrom
    if (dateTo)   params.date_to   = dateTo
    Promise.allSettled([
      taService.getHoursLogs(params),
      taService.getMentorships(params),
    ]).then(([h, m]) => {
      if (h.status === 'fulfilled') setHoursLogs(h.value.data?.results ?? h.value.data ?? [])
      if (m.status === 'fulfilled') setMentorships(m.value.data?.results ?? m.value.data ?? [])
      setLoading(false)
    })
  }, [dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const handleHoursSaved = (entry, isUpdate) => {
    setHoursLogs(prev => isUpdate ? prev.map(e => e.id === entry.id ? entry : e) : [entry, ...prev])
  }
  const handleMentorshipSaved = (entry, isUpdate) => {
    setMentorships(prev => isUpdate ? prev.map(e => e.id === entry.id ? entry : e) : [entry, ...prev])
  }

  const deleteHoursLog = async (id) => {
    const r = await Swal.fire({ title: 'Delete this log?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#E06C75', confirmButtonText: 'Delete' })
    if (!r.isConfirmed) return
    await taService.deleteHoursLog(id)
    setHoursLogs(prev => prev.filter(e => e.id !== id))
  }

  const deleteMentorship = async (id) => {
    const r = await Swal.fire({ title: 'Delete this mentorship?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#E06C75', confirmButtonText: 'Delete' })
    if (!r.isConfirmed) return
    await taService.deleteMentorship(id)
    setMentorships(prev => prev.filter(e => e.id !== id))
  }

  const classHours    = hoursLogs.filter(l => l.log_type === 'class_hours')
  const taskReview    = hoursLogs.filter(l => l.log_type === 'task_review')
  const totalClassHrs = classHours.reduce((s, l) => s + parseFloat(l.total_hours || 0), 0)
  const totalTaskHrs  = taskReview.reduce((s, l) => s + parseFloat(l.total_hours || 0), 0)
  const totalMentHrs  = mentorships.reduce((s, m) => s + parseFloat(m.total_hours || 0), 0)

  const cardStyle = { background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: 0 }}>My Logs & Reports</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Track your hours and mentorships</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: '#64748B' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', outline: 'none', background: 'white' }} />
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', outline: 'none', background: 'white' }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', textDecoration: 'underline' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Class Hours',   val: totalClassHrs.toFixed(1), color: '#1D4ED8', bg: '#DBEAFE' },
          { label: 'Task Review',   val: totalTaskHrs.toFixed(1),  color: '#065F46', bg: '#D1FAE5' },
          { label: 'Mentorships',   val: totalMentHrs.toFixed(1),  color: '#7C3AED', bg: '#EDE9FE' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={18} strokeWidth={2} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{val}</p>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{label} hrs</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2-column: Hours + Mentorships */}
      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Hours Logs */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Clock size={15} strokeWidth={2} style={{ color: '#1D4ED8' }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>Hours Logs</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>({hoursLogs.length})</span>
              </div>
              <button onClick={() => { setEditing(null); setModal('hours') }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#4E89BD', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'white', fontWeight: 600, padding: '6px 12px' }}>
                <Plus size={13} /> New
              </button>
            </div>
            {hoursLogs.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94A3B8' }}>
                <Clock size={28} strokeWidth={1.4} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '13px' }}>No logs{dateFrom || dateTo ? ' in this date range' : ' yet'}</p>
              </div>
            ) : hoursLogs.map(log => {
              const b = TYPE_BADGE[log.log_type] || TYPE_BADGE.class_hours
              return (
                <div key={log.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: b.color, background: b.bg, padding: '1px 7px', borderRadius: '20px' }}>{b.label}</span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{fmtDate(log.date)}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{log.cohort}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{fmt(log.start_time)} – {fmt(log.end_time)} · <b>{parseFloat(log.total_hours).toFixed(2)}h</b></p>
                    {log.notes && <p style={{ fontSize: '11px', color: '#94A3B8', margin: '3px 0 0', fontStyle: 'italic' }}>{log.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => { setEditing(log); setModal('hours') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
                      <BookCheck size={14} />
                    </button>
                    <button onClick={() => deleteHoursLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E06C75', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mentorships */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Users size={15} strokeWidth={2} style={{ color: '#7C3AED' }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>Mentorships</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>({mentorships.length})</span>
              </div>
              <button onClick={() => { setEditing(null); setModal('mentorship') }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#7C3AED', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'white', fontWeight: 600, padding: '6px 12px' }}>
                <Plus size={13} /> New
              </button>
            </div>
            {mentorships.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94A3B8' }}>
                <Users size={28} strokeWidth={1.4} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '13px' }}>No mentorships{dateFrom || dateTo ? ' in this date range' : ' yet'}</p>
              </div>
            ) : mentorships.map(m => (
              <div key={m.id} style={{ padding: '12px 18px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white' }}>
                  {(m.student_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{m.student_name}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{m.cohort} · {fmtDate(m.date)}</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{fmt(m.start_time)} – {fmt(m.end_time)} · <b>{parseFloat(m.total_hours).toFixed(2)}h</b></p>
                  {m.notes && <p style={{ fontSize: '11px', color: '#94A3B8', margin: '3px 0 0', fontStyle: 'italic' }}>{m.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => { setEditing(m); setModal('mentorship') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
                    <BookCheck size={14} />
                  </button>
                  <button onClick={() => deleteMentorship(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E06C75', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal === 'hours' && (
        <HoursModal
          initial={editing}
          onClose={() => setModal(null)}
          onSaved={handleHoursSaved}
        />
      )}
      {modal === 'mentorship' && (
        <MentorshipModal
          initial={editing}
          onClose={() => setModal(null)}
          onSaved={handleMentorshipSaved}
        />
      )}
    </div>
  )
}
