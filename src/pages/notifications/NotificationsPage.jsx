import { useEffect, useState } from 'react'
import {
  Bell, CheckCheck, Trash2, FileText, Video,
  CheckCircle2, XCircle, Star, Plus,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import notificationService from '@/services/notificationService'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

const NOTIFICATION_TYPES = [
  'application_update', 'interview_scheduled', 'offer_received',
  'hired', 'rejected', 'general',
]

const TYPE_META = {
  application_update: { label: 'Application Update', Icon: FileText,      bg: '#EFF6FF', color: '#4E89BD' },
  interview_scheduled:{ label: 'Interview Scheduled', Icon: Video,         bg: '#FFFBEB', color: '#D97706' },
  offer_received:     { label: 'Offer Received',      Icon: CheckCircle2,  bg: '#F0FDF4', color: '#16A34A' },
  hired:              { label: 'Hired',                Icon: Star,          bg: '#F0FDF4', color: '#16A34A' },
  rejected:           { label: 'Rejected',             Icon: XCircle,       bg: '#FFF1F2', color: '#E06C75' },
  general:            { label: 'General',              Icon: Bell,          bg: '#F8FAFC', color: '#64748B' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function NotifCard({ notif, isPrivileged, onMarkRead, onDelete }) {
  const meta = TYPE_META[notif.notification_type] || TYPE_META.general
  const { Icon } = meta

  return (
    <div style={{
      display: 'flex', gap: '14px', alignItems: 'flex-start',
      padding: '16px 20px',
      background: notif.is_read ? 'white' : '#F0F7FF',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.2s',
    }}>
      {/* Icon bubble */}
      <div style={{
        width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
        background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} strokeWidth={2} style={{ color: meta.color }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isPrivileged && notif.applicant_name && (
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {notif.applicant_name}
          </p>
        )}
        <p style={{ fontSize: '14px', fontWeight: notif.is_read ? 500 : 700, color: 'var(--text)', lineHeight: 1.4 }}>
          {notif.title}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 }}>
          {notif.message}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: meta.color, fontWeight: 600 }}>{meta.label}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>·</span>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{timeAgo(notif.created_at)}</span>
          {!notif.is_read && (
            <>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>·</span>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#4E89BD', flexShrink: 0,
              }} />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {!notif.is_read && (
          <button
            title="Mark as read"
            onClick={() => onMarkRead(notif)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#16A34A', display: 'flex', alignItems: 'center' }}
          >
            <CheckCheck size={15} />
          </button>
        )}
        <button
          title="Delete"
          onClick={() => onDelete(notif)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#E06C75', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [applicants, setApplicants]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const groups = user?.groups ?? []
  const isPrivileged = user?.is_staff || groups.includes('Hub Admin') || groups.includes('Staff')

  const fetchData = async () => {
    setLoading(true)
    try {
      const promises = [notificationService.getAll()]
      if (isPrivileged) promises.push(applicantService.getAll())
      const [notifRes, appRes] = await Promise.all(promises)
      setNotifications(notifRes.data.results ?? notifRes.data)
      if (appRes) setApplicants(appRes.data.results ?? appRes.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleMarkRead = async (notif) => {
    try {
      await notificationService.markRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not mark as read.', confirmButtonColor: '#4E89BD' })
    }
  }

  const handleMarkAllRead = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Mark all as read?', icon: 'question',
      showCancelButton: true, confirmButtonColor: '#4E89BD', confirmButtonText: 'Mark all read',
    })
    if (!isConfirmed) return
    try {
      const unread = notifications.filter(n => !n.is_read)
      await Promise.all(unread.map(n => notificationService.markRead(n.id)))
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not mark all as read.', confirmButtonColor: '#4E89BD' })
    }
  }

  const handleDelete = async (notif) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete notification?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete',
    })
    if (!isConfirmed) return
    try {
      await notificationService.remove(notif.id)
      setNotifications(prev => prev.filter(n => n.id !== notif.id))
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete.', confirmButtonColor: '#4E89BD' })
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await notificationService.create(data)
      setModalOpen(false)
      reset({})
      fetchData()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <Bell strokeWidth={2} />
          </div>
          <div>
            <h2 className="page-title">Notifications</h2>
            <p className="page-subtitle">
              {notifications.length} total · {unread} unread
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
          {isPrivileged && (
            <Button size="sm" onClick={() => { reset({}); setModalOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Send Notification
            </Button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div style={{
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        background: 'white', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {loading ? (
          <div style={{ position: 'relative', height: '200px' }}><SpinnerOverlay /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <Bell strokeWidth={1.5} />
            <p className="empty-state-title">No notifications yet</p>
            <p className="empty-state-desc">You'll be notified when your application status changes.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              isPrivileged={isPrivileged}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Send notification modal — privileged only */}
      {isPrivileged && (
        <FormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Send Notification"
          onSubmit={handleSubmit(onSubmit)}
          loading={saving}
        >
          <div className="form-group">
            <Label>Applicant *</Label>
            <select {...register('applicant', { required: 'Required' })} className="form-select">
              <option value="">— Select Applicant —</option>
              {applicants.map(a => (
                <option key={a.id} value={a.id}>
                  {a.full_name || `${a.first_name} ${a.last_name}`}
                </option>
              ))}
            </select>
            {errors.applicant && <p className="form-error">{errors.applicant.message}</p>}
          </div>
          <div className="form-group">
            <Label>Type</Label>
            <select {...register('notification_type')} className="form-select">
              {NOTIFICATION_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Label>Title *</Label>
            <Input {...register('title', { required: 'Required' })} placeholder="Notification title" />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          <div className="form-group">
            <Label>Message *</Label>
            <textarea
              {...register('message', { required: 'Required' })}
              rows={3} placeholder="Notification message..." className="form-textarea"
            />
            {errors.message && <p className="form-error">{errors.message.message}</p>}
          </div>
        </FormModal>
      )}
    </div>
  )
}
