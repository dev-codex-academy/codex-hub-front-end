import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react'
import Swal from 'sweetalert2'
import educationService from '@/services/educationService'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

const DEGREE_TYPES = [
  'high_school', 'associate', 'bachelor', 'master',
  'doctorate', 'bootcamp', 'certification', 'other',
]

const DEGREE_LABELS = {
  high_school: 'High School',
  associate: 'Associate',
  bachelor: "Bachelor's",
  master: "Master's",
  doctorate: 'Doctorate / PhD',
  bootcamp: 'Bootcamp',
  certification: 'Certification',
  other: 'Other',
}

const DEGREE_COLORS = {
  doctorate: 'hired',
  master: 'approved',
  bachelor: 'approved',
  associate: 'pending',
  bootcamp: 'warning',
  certification: 'warning',
  high_school: 'default',
  other: 'default',
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

export default function EducationPage() {
  const [records, setRecords] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [eduRes, appRes] = await Promise.all([
        educationService.getAll(),
        applicantService.getAll(),
      ])
      setRecords(eduRes.data.results ?? eduRes.data)
      setApplicants(appRes.data.results ?? appRes.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openNew = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (rec) => {
    setEditing(rec)
    reset({
      applicant: rec.applicant,
      institution: rec.institution,
      degree_type: rec.degree_type,
      field_of_study: rec.field_of_study,
      start_date: rec.start_date,
      end_date: rec.end_date ?? '',
      is_current: rec.is_current,
      gpa: rec.gpa ?? '',
      description: rec.description,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        end_date: data.end_date || null,
        gpa: data.gpa || null,
      }
      if (editing) {
        await educationService.update(editing.id, payload)
      } else {
        await educationService.create(payload)
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save education record.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rec) => {
    const result = await Swal.fire({
      title: 'Delete education record?',
      text: `${rec.institution} will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
    })
    if (result.isConfirmed) {
      try {
        await educationService.remove(rec.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete record.', confirmButtonColor: '#4E89BD' })
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <GraduationCap strokeWidth={2} />
          </div>
          <div>
            <h2 className="page-title">Education</h2>
            <p className="page-subtitle">{records.length} record{records.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Record
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? <SpinnerOverlay /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Field of Study</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="empty-state">
                        <GraduationCap strokeWidth={1.5} />
                        <p className="empty-state-title">No education records yet</p>
                        <p className="empty-state-desc">Add academic background for your applicants</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.applicant_name}</TableCell>
                    <TableCell>{rec.institution}</TableCell>
                    <TableCell>
                      <Badge variant={DEGREE_COLORS[rec.degree_type] || 'default'}>
                        {DEGREE_LABELS[rec.degree_type] || rec.degree_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{rec.field_of_study || '—'}</TableCell>
                    <TableCell>
                      {formatDate(rec.start_date)} — {rec.is_current ? 'Present' : formatDate(rec.end_date)}
                    </TableCell>
                    <TableCell>{rec.gpa ?? '—'}</TableCell>
                    <TableCell>
                      <div className="row-actions">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(rec)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rec)}>
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

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Education Record' : 'New Education Record'}
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
          <Label>Institution *</Label>
          <Input
            {...register('institution', { required: 'Required' })}
            placeholder="e.g. MIT, Platzi, Coursera"
          />
          {errors.institution && <p className="form-error">{errors.institution.message}</p>}
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Degree Type</Label>
            <select {...register('degree_type')} className="form-select">
              {DEGREE_TYPES.map(d => (
                <option key={d} value={d}>{DEGREE_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Label>Field of Study</Label>
            <Input {...register('field_of_study')} placeholder="Computer Science" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Start Date *</Label>
            <Input type="date" {...register('start_date', { required: 'Required' })} />
            {errors.start_date && <p className="form-error">{errors.start_date.message}</p>}
          </div>
          <div className="form-group">
            <Label>End Date</Label>
            <Input type="date" {...register('end_date')} />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-check">
            <input type="checkbox" id="is_current_edu" {...register('is_current')} className="h-4 w-4" />
            <Label htmlFor="is_current_edu">Currently enrolled</Label>
          </div>
          <div className="form-group">
            <Label>GPA</Label>
            <Input type="number" step="0.01" min="0" max="4" {...register('gpa')} placeholder="3.8" />
          </div>
        </div>
        <div className="form-group">
          <Label>Description</Label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Honors, thesis, relevant coursework..."
            className="form-textarea"
          />
        </div>
      </FormModal>
    </div>
  )
}
