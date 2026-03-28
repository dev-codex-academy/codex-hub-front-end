import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Bell, Trash2, CheckCheck } from 'lucide-react'
import Swal from 'sweetalert2'
import notificationService from '@/services/notificationService'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

const NOTIFICATION_TYPES = [
  'application_update', 'interview_scheduled', 'offer_received',
  'hired', 'rejected', 'general',
]

const TYPE_COLORS = {
  application_update: 'pending',
  interview_scheduled: 'warning',
  offer_received: 'approved',
  hired: 'hired',
  rejected: 'rejected',
  general: 'default',
}

const TYPE_LABELS = {
  application_update: 'Application Update',
  interview_scheduled: 'Interview Scheduled',
  offer_received: 'Offer Received',
  hired: 'Hired',
  rejected: 'Rejected',
  general: 'General',
}

const formatDate = (d) => d ? new Date(d).toLocaleString() : '—'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [notifRes, appRes] = await Promise.all([
        notificationService.getAll(),
        applicantService.getAll(),
      ])
      setNotifications(notifRes.data.results ?? notifRes.data)
      setApplicants(appRes.data.results ?? appRes.data)
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
      fetchData()
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not mark as read.', confirmButtonColor: '#4E89BD' })
    }
  }

  const handleMarkAllRead = async (applicantId) => {
    try {
      await notificationService.markAllRead(applicantId)
      fetchData()
      Swal.fire({ icon: 'success', title: 'Done', text: 'All notifications marked as read.', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not mark all as read.', confirmButtonColor: '#4E89BD' })
    }
  }

  const handleDelete = async (notif) => {
    const result = await Swal.fire({
      title: 'Delete notification?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
    })
    if (result.isConfirmed) {
      try {
        await notificationService.remove(notif.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete notification.', confirmButtonColor: '#4E89BD' })
      }
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
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to send notification.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
              {notifications.length} total · {unreadCount} unread
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={openMarkAllDialog}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
          <Button size="sm" onClick={() => { reset({}); setModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Send Notification
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {loading ? <SpinnerOverlay /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="empty-state">
                        <Bell strokeWidth={1.5} />
                        <p className="empty-state-title">No notifications yet</p>
                        <p className="empty-state-desc">Notifications are created automatically when application stages change</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : notifications.map(notif => (
                  <TableRow key={notif.id} style={!notif.is_read ? { fontWeight: 600 } : {}}>
                    <TableCell>{notif.applicant_name}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_COLORS[notif.notification_type] || 'default'}>
                        {TYPE_LABELS[notif.notification_type] || notif.notification_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{notif.title}</TableCell>
                    <TableCell style={{ maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notif.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notif.is_read ? 'default' : 'pending'}>
                        {notif.is_read ? 'Read' : 'Unread'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(notif.created_at)}</TableCell>
                    <TableCell>
                      <div className="row-actions">
                        {!notif.is_read && (
                          <Button variant="ghost" size="icon" title="Mark as read" onClick={() => handleMarkRead(notif)}>
                            <CheckCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(notif)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send manual notification modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Send Notification"
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Applicant *</Label>
          <select
            {...register('applicant', { required: 'Required' })}
            className="form-select"
          >
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
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <Label>Title *</Label>
          <Input
            {...register('title', { required: 'Required' })}
            placeholder="Notification title"
          />
          {errors.title && <p className="form-error">{errors.title.message}</p>}
        </div>
        <div className="form-group">
          <Label>Message *</Label>
          <textarea
            {...register('message', { required: 'Required' })}
            rows={3}
            placeholder="Notification message..."
            className="form-textarea"
          />
          {errors.message && <p className="form-error">{errors.message.message}</p>}
        </div>
      </FormModal>
    </div>
  )
}

// Helper to ask which applicant to mark all read for
async function openMarkAllDialog() {
  // This is handled by calling the endpoint with no filter (marks all globally)
  // For a quick MVP we just call without a specific applicant
  const result = await Swal.fire({
    title: 'Mark all as read?',
    text: 'This will mark all unread notifications as read.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4E89BD',
    confirmButtonText: 'Mark All Read',
  })
  if (result.isConfirmed) {
    try {
      await notificationService.getAll({ is_read: false }).then(async (res) => {
        const unread = res.data.results ?? res.data
        await Promise.all(unread.map(n => notificationService.markRead(n.id)))
      })
      window.location.reload()
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not mark all as read.', confirmButtonColor: '#4E89BD' })
    }
  }
}
