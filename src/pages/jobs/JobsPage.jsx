import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import Swal from 'sweetalert2'
import jobService from '@/services/jobService'
import positionService from '@/services/positionService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'intern', 'temporary']
const JOB_STATUSES = ['open', 'in_process', 'paused', 'cancelled', 'closed']

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const isInternal = watch('is_internal')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, posRes] = await Promise.all([
        jobService.getAll(),
        positionService.getAll(),
      ])
      setJobs(jobsRes.data.results ?? jobsRes.data)
      setPositions(posRes.data.results ?? posRes.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (job) => {
    setEditing(job)
    reset({
      title: job.title,
      position: job.position,
      external_position_title: job.external_position_title,
      company_name: job.company_name,
      is_internal: job.is_internal,
      job_type: job.job_type,
      status: job.status,
      description: job.description,
      requirements: job.requirements,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) {
        await jobService.update(editing.id, data)
      } else {
        await jobService.create(data)
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save job.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (job) => {
    const result = await Swal.fire({
      title: 'Delete job posting?',
      text: `"${job.title}" will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
    })
    if (result.isConfirmed) {
      try {
        await jobService.remove(job.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete job.', confirmButtonColor: '#4E89BD' })
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <ClipboardList strokeWidth={2} />
          </div>
          <div>
            <h2 className="page-title">Jobs</h2>
            <p className="page-subtitle">{jobs.length} record{jobs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Job
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <SpinnerOverlay />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Internal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="empty-state">
                        <ClipboardList strokeWidth={1.5} />
                        <p className="empty-state-title">No job postings yet</p>
                        <p className="empty-state-desc">Post your first job opening to start recruiting</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.position_display || job.position_title || '—'}</TableCell>
                      <TableCell>{job.display_company || job.company || '—'}</TableCell>
                      <TableCell>{job.is_internal ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{job.job_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}</TableCell>
                      <TableCell><StatusBadge status={job.status} /></TableCell>
                      <TableCell>{job.application_count ?? '—'}</TableCell>
                      <TableCell>
                        <div className="row-actions">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(job)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(job)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Job' : 'New Job'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Title *</Label>
          <Input {...register('title', { required: 'Required' })} placeholder="Senior Developer" />
          {errors.title && <p className="form-error">{errors.title.message}</p>}
        </div>
        <div className="form-check">
          <input type="checkbox" id="is_internal" {...register('is_internal')} className="h-4 w-4" />
          <Label htmlFor="is_internal">Internal posting (CodeX Academy)</Label>
        </div>
        {isInternal ? (
          <div className="form-group">
            <Label>Position *</Label>
            <select
              {...register('position', { required: isInternal ? 'Required' : false })}
              className="form-select"
            >
              <option value="">— Select Position —</option>
              {positions.filter(p => p.is_internal).map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {errors.position && <p className="form-error">{errors.position.message}</p>}
          </div>
        ) : (
          <div className="form-grid-2">
            <div className="form-group">
              <Label>Position Title *</Label>
              <Input
                {...register('external_position_title', { required: !isInternal ? 'Required' : false })}
                placeholder="Senior React Developer"
              />
              {errors.external_position_title && <p className="form-error">{errors.external_position_title.message}</p>}
            </div>
            <div className="form-group">
              <Label>Company Name *</Label>
              <Input
                {...register('company_name', { required: !isInternal ? 'Required' : false })}
                placeholder="Acme Corp"
              />
              {errors.company_name && <p className="form-error">{errors.company_name.message}</p>}
            </div>
          </div>
        )}
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Job Type</Label>
            <select
              {...register('job_type')}
              className="form-select"
            >
              {JOB_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Label>Status</Label>
            <select
              {...register('status')}
              className="form-select"
            >
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <Label>Description</Label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Job description..."
            className="form-textarea"
          />
        </div>
        <div className="form-group">
          <Label>Requirements</Label>
          <textarea
            {...register('requirements')}
            rows={3}
            placeholder="Requirements..."
            className="form-textarea"
          />
        </div>
      </FormModal>
    </div>
  )
}
