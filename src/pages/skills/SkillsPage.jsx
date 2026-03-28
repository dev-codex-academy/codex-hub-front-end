import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'
import Swal from 'sweetalert2'
import skillService from '@/services/skillService'
import applicantSkillService from '@/services/applicantSkillService'
import applicantService from '@/services/applicantService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { SpinnerOverlay } from '@/components/ui/spinner'
import FormModal from '@/components/common/FormModal'

const CATEGORIES = ['technical', 'soft', 'language', 'tool', 'other']
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

const CATEGORY_COLORS = {
  technical: 'approved',
  soft: 'pending',
  language: 'warning',
  tool: 'default',
  other: 'default',
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([])
  const [applicantSkills, setApplicantSkills] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Skill catalog modal
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)

  // Assign skill to applicant modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const skillForm = useForm()
  const assignForm = useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skillsRes, appSkillsRes, applicantsRes] = await Promise.all([
        skillService.getAll(),
        applicantSkillService.getAll(),
        applicantService.getAll(),
      ])
      setSkills(skillsRes.data.results ?? skillsRes.data)
      setApplicantSkills(appSkillsRes.data.results ?? appSkillsRes.data)
      setApplicants(applicantsRes.data.results ?? applicantsRes.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Skill catalog CRUD ────────────────────────────────────────────────────

  const openNewSkill = () => {
    setEditingSkill(null)
    skillForm.reset({})
    setSkillModalOpen(true)
  }

  const openEditSkill = (skill) => {
    setEditingSkill(skill)
    skillForm.reset({ name: skill.name, category: skill.category, description: skill.description })
    setSkillModalOpen(true)
  }

  const onSubmitSkill = async (data) => {
    setSaving(true)
    try {
      if (editingSkill) {
        await skillService.update(editingSkill.id, data)
      } else {
        await skillService.create(data)
      }
      setSkillModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save skill.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSkill = async (skill) => {
    const result = await Swal.fire({
      title: 'Delete skill?',
      text: `"${skill.name}" will be removed from the catalog.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
    })
    if (result.isConfirmed) {
      try {
        await skillService.remove(skill.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete skill.', confirmButtonColor: '#4E89BD' })
      }
    }
  }

  // ── Assign skill to applicant ─────────────────────────────────────────────

  const onSubmitAssign = async (data) => {
    setSaving(true)
    try {
      await applicantSkillService.create(data)
      setAssignModalOpen(false)
      assignForm.reset({})
      fetchData()
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to assign skill.'
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#4E89BD' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveApplicantSkill = async (as) => {
    const result = await Swal.fire({
      title: 'Remove skill?',
      text: `Remove "${as.skill_name}" from ${as.applicant_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Remove',
    })
    if (result.isConfirmed) {
      try {
        await applicantSkillService.remove(as.id)
        fetchData()
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not remove skill.', confirmButtonColor: '#4E89BD' })
      }
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <Zap strokeWidth={2} />
          </div>
          <div>
            <h2 className="page-title">Skills</h2>
            <p className="page-subtitle">{skills.length} in catalog · {applicantSkills.length} assigned</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={() => { assignForm.reset({}); setAssignModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Assign to Applicant
          </Button>
          <Button size="sm" onClick={openNewSkill}>
            <Plus className="h-4 w-4 mr-1" /> New Skill
          </Button>
        </div>
      </div>

      {/* Skill catalog */}
      <p className="page-subtitle" style={{ marginBottom: '8px', fontWeight: 600 }}>Skill Catalog</p>
      <Card style={{ marginBottom: '24px' }}>
        <CardContent>
          {loading ? <SpinnerOverlay /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="empty-state">
                        <Zap strokeWidth={1.5} />
                        <p className="empty-state-title">No skills yet</p>
                        <p className="empty-state-desc">Build the skill catalog for your applicants</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : skills.map(skill => (
                  <TableRow key={skill.id}>
                    <TableCell>{skill.name}</TableCell>
                    <TableCell>
                      <Badge variant={CATEGORY_COLORS[skill.category] || 'default'}>
                        {skill.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{skill.description || '—'}</TableCell>
                    <TableCell>
                      <div className="row-actions">
                        <Button variant="ghost" size="icon" onClick={() => openEditSkill(skill)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill)}>
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

      {/* Applicant skills */}
      <p className="page-subtitle" style={{ marginBottom: '8px', fontWeight: 600 }}>Assigned to Applicants</p>
      <Card>
        <CardContent>
          {loading ? <SpinnerOverlay /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Years Exp.</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicantSkills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="empty-state">
                        <Zap strokeWidth={1.5} />
                        <p className="empty-state-title">No skills assigned yet</p>
                        <p className="empty-state-desc">Use "Assign to Applicant" to add skills</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applicantSkills.map(as => (
                  <TableRow key={as.id}>
                    <TableCell>{as.applicant_name}</TableCell>
                    <TableCell>{as.skill_name}</TableCell>
                    <TableCell>
                      <Badge variant={CATEGORY_COLORS[as.skill_category] || 'default'}>
                        {as.skill_category}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textTransform: 'capitalize' }}>{as.level}</TableCell>
                    <TableCell>{as.years_of_experience ?? '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveApplicantSkill(as)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New / Edit Skill modal */}
      <FormModal
        open={skillModalOpen}
        onOpenChange={setSkillModalOpen}
        title={editingSkill ? 'Edit Skill' : 'New Skill'}
        onSubmit={skillForm.handleSubmit(onSubmitSkill)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Name *</Label>
          <Input {...skillForm.register('name', { required: 'Required' })} placeholder="e.g. Python" />
          {skillForm.formState.errors.name && (
            <p className="form-error">{skillForm.formState.errors.name.message}</p>
          )}
        </div>
        <div className="form-group">
          <Label>Category</Label>
          <select {...skillForm.register('category')} className="form-select">
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <Label>Description</Label>
          <textarea
            {...skillForm.register('description')}
            rows={2}
            placeholder="Brief description..."
            className="form-textarea"
          />
        </div>
      </FormModal>

      {/* Assign Skill to Applicant modal */}
      <FormModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        title="Assign Skill to Applicant"
        onSubmit={assignForm.handleSubmit(onSubmitAssign)}
        loading={saving}
      >
        <div className="form-group">
          <Label>Applicant *</Label>
          <select
            {...assignForm.register('applicant', { required: 'Required' })}
            className="form-select"
          >
            <option value="">— Select Applicant —</option>
            {applicants.map(a => (
              <option key={a.id} value={a.id}>
                {a.full_name || `${a.first_name} ${a.last_name}`}
              </option>
            ))}
          </select>
          {assignForm.formState.errors.applicant && (
            <p className="form-error">{assignForm.formState.errors.applicant.message}</p>
          )}
        </div>
        <div className="form-group">
          <Label>Skill *</Label>
          <select
            {...assignForm.register('skill', { required: 'Required' })}
            className="form-select"
          >
            <option value="">— Select Skill —</option>
            {skills.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
            ))}
          </select>
          {assignForm.formState.errors.skill && (
            <p className="form-error">{assignForm.formState.errors.skill.message}</p>
          )}
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <Label>Level</Label>
            <select {...assignForm.register('level')} className="form-select">
              {LEVELS.map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <Label>Years of Experience</Label>
            <Input
              type="number"
              min={0}
              {...assignForm.register('years_of_experience')}
              placeholder="e.g. 3"
            />
          </div>
        </div>
      </FormModal>
    </div>
  )
}
