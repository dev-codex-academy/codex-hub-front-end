
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { UploadIcon, ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import applicantService from '@/services/applicantService'
import workExperienceService from '@/services/workExperienceService'
import jobApplicationService from '@/services/jobApplicationService'
import { useAuth } from '@/context/AuthContext'
import { safeParseJSON } from './utils/storage'
import { SectionHeading } from './components/SectionHeading'
import { SkillsSection } from './components/SkillsSection'
import { WorkExperienceSection } from './components/WorkExperienceSection'
import { ApplicationsSection } from './components/ApplicationsSection'
import savedJobsService from './services/savedJobsService'

const DEFAULT_SKILLS = [
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'AWS',
  'REST APIs',
  'Git',
  'Tailwind CSS',
]

const buildSkill = (name) => ({
  id:
    (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  name,
})

const buildProfileFormState = (data) => ({
  first_name: data?.first_name || '',
  last_name: data?.last_name || '',
  headline: data?.headline || data?.tags || '',
  summary: data?.summary || '',
  email: data?.email || '',
  phone: data?.phone || '',
  linkedin_url: data?.linkedin_url || '',
  portfolio_url: data?.portfolio_url || '',
  city: data?.city || '',
  state: data?.state || '',
  country: data?.country || '',
})

export default function CodexHubProfilePage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [applications, setApplications] = useState([])
  const [fallbackApplications, setFallbackApplications] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState({})
  const [profileNotice, setProfileNotice] = useState('')
  const [uploadState, setUploadState] = useState('idle')
  const [uploadError, setUploadError] = useState('')
  const [profileSaveError, setProfileSaveError] = useState('')
  const [workExperiences, setWorkExperiences] = useState([])
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [editingExperienceId, setEditingExperienceId] = useState(null)
  const [editingExperience, setEditingExperience] = useState(null)
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    title: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  })
  const [experienceError, setExperienceError] = useState('')
  const [experienceSaving, setExperienceSaving] = useState(false)
  const [experienceToast, setExperienceToast] = useState('')
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [editingSkillId, setEditingSkillId] = useState(null)
  const [editingSkillValue, setEditingSkillValue] = useState('')
  const [skillMenuId, setSkillMenuId] = useState(null)
  const fileInputRef = useRef(null)
  const skillsHydratedRef = useRef(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await applicantService.getMyProfile()
        const data = res.data
        setProfileData(data)
        setProfileNotice('')
      } catch (error) {
        setProfileNotice(
          error?.response?.status === 403
            ? 'Profile access is limited for this account. Contact an admin if this persists.'
            : 'Could not load your profile. Please try again.',
        )
      } finally {
        setProfileLoaded(true)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!profileData) return
    setFormState(buildProfileFormState(profileData))
  }, [profileData])

  useEffect(() => {
    if (!profileData) return
    const baseItems = profileData.work_experiences
    setWorkExperiences(sortExperiences(Array.isArray(baseItems) ? baseItems : []))
  }, [profileData])

  useEffect(() => {
    const raw = localStorage.getItem('studentSkills')
    if (!raw) {
      setSkills(DEFAULT_SKILLS.map((skill) => buildSkill(skill)))
      skillsHydratedRef.current = true
      return
    }
    const parsed = safeParseJSON(raw, [])
    if (Array.isArray(parsed) && parsed.length) {
      setSkills(parsed)
    } else {
      setSkills(DEFAULT_SKILLS.map((skill) => buildSkill(skill)))
    }
    skillsHydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!skillsHydratedRef.current) return
    localStorage.setItem('studentSkills', JSON.stringify(skills))
  }, [skills])

  useEffect(() => {
    if (!profileData) return
    if (Array.isArray(user?.permissions) && !user.permissions.includes('app.view_workexperience')) {
      setWorkExperiences([])
      return
    }
    const fetchExperiences = async () => {
      try {
        const res = await workExperienceService.getAll({ applicant: profileData.id })
        const items = res.data?.results ?? res.data ?? []
        setWorkExperiences(sortExperiences(Array.isArray(items) ? items : []))
      } catch (error) {
        if (error?.response?.status === 403) {
          setWorkExperiences([])
          return
        }
        console.error('Failed to fetch work experiences:', error)
      }
    }
    fetchExperiences()
  }, [profileData])

  useEffect(() => {
    if (!profileData) return
    if (Array.isArray(user?.permissions) && !user.permissions.includes('app.view_jobapplication')) {
      setApplications([])
      return
    }
    const loadApplications = async () => {
      try {
        const res = await jobApplicationService.getAll({ applicant: profileData.id })
        const apps = res.data?.results ?? res.data ?? []
        const safeApps = Array.isArray(apps) ? apps : []
        setApplications(safeApps)
        const ids = safeApps
          .map((app) => app.job?.id || app.job)
          .filter(Boolean)
        if (ids.length) {
          localStorage.setItem('appliedJobIds', JSON.stringify(ids))
        }
      } catch (error) {
        if (error?.response?.status === 403) {
          setApplications([])
          return
        }
        console.error('Failed to load applications:', error)
      }
    }
    loadApplications()
  }, [profileData])

  useEffect(() => {
    setSavedJobs(savedJobsService.getSavedJobsLocal())
  }, [])

  useEffect(() => {
    const userKey =
      localStorage.getItem('applicantId') ||
      localStorage.getItem('username') ||
      'guest'
    const raw = localStorage.getItem(`appliedJobs:${userKey}`)
    if (!raw) return
    const parsed = safeParseJSON(raw, [])
    if (Array.isArray(parsed)) {
      setFallbackApplications(parsed)
    }
  }, [])

  useEffect(() => {
    if (!experienceToast) return
    const timer = setTimeout(() => {
      setExperienceToast('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [experienceToast])

  useEffect(() => {
    if (uploadState !== 'success') return
    const timer = setTimeout(() => {
      setUploadState('idle')
    }, 3000)
    return () => clearTimeout(timer)
  }, [uploadState])

  const fullName = useMemo(() => {
    if (!profileData) return user?.first_name || user?.username || 'Student'
    const name = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
    return name || profileData.username || user?.username || 'Student'
  }, [profileData, user])

  const formatStage = (stage) => {
    if (!stage) return 'Applied'
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const resolveJobTitle = (app) =>
    app.job_title ||
    app.job?.title ||
    app.job?.position?.title ||
    'Job Application'

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profileData) return
    try {
      setProfileSaveError('')
      const res = await applicantService.updateMyProfile(formState)
      setProfileData(res.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update failed:', error)
      setProfileSaveError(
        error?.message || 'Profile update failed. Please try again.',
      )
    }
  }

  const handleUploadClick = () => {
    setUploadError('')
    fileInputRef.current?.click()
  }

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (
      ![
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type)
    ) {
      setUploadError('Please upload a PDF, DOC, or DOCX file.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be 5MB or smaller.')
      event.target.value = ''
      return
    }
    if (!profileData) return

    setUploadState('loading')
    setUploadError('')
    try {
      const res = await applicantService.uploadMyCV(profileData.id, file)
      setProfileData((prev) => ({ ...prev, ...res.data }))
      setUploadState('success')
    } catch (error) {
      setUploadState('error')
      setUploadError(
        error?.message ||
          'CV upload failed. The HR server may be down or misconfigured.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const handleCancel = () => {
    if (!profileData) return
    setFormState(buildProfileFormState(profileData))
    setIsEditing(false)
  }

  const handleExperienceChange = (field, value) => {
    setExperienceForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    const trimmed = newSkill.trim()
    if (!trimmed) return
    setSkills((prev) => [buildSkill(trimmed), ...prev])
    setNewSkill('')
  }

  const handleEditSkillStart = (skill) => {
    setEditingSkillId(skill.id)
    setEditingSkillValue(skill.name)
    setSkillMenuId(null)
  }

  const handleEditSkillSave = () => {
    const trimmed = editingSkillValue.trim()
    if (!trimmed) return
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === editingSkillId ? { ...skill, name: trimmed } : skill,
      ),
    )
    setEditingSkillId(null)
    setEditingSkillValue('')
  }

  const handleDeleteSkill = (skillId) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== skillId))
    setSkillMenuId(null)
    if (editingSkillId === skillId) {
      setEditingSkillId(null)
      setEditingSkillValue('')
    }
  }

  const sortExperiences = (items) => {
    try {
      return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
        const aDate = a.start_date || ''
        const bDate = b.start_date || ''
        return bDate.localeCompare(aDate)
      })
    } catch {
      return []
    }
  }

  const handleExperienceEditChange = (field, value) => {
    setEditingExperience((prev) => ({ ...prev, [field]: value }))
  }

  const handleExperienceCancel = () => {
    setExperienceError('')
    setIsAddingExperience(false)
    setEditingExperienceId(null)
    setEditingExperience(null)
    setExperienceSaving(false)
    setExperienceForm({
      company: '',
      title: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    })
  }

  const handleExperienceSave = async () => {
    if (!profileData) return

    if (
      !experienceForm.company.trim() ||
      !experienceForm.title.trim() ||
      !experienceForm.start_date
    ) {
      setExperienceError('Company, title, and start date are required.')
      return
    }

    setExperienceSaving(true)
    setExperienceError('')
    try {
      const payload = {
        applicant: profileData.id,
        company: experienceForm.company.trim(),
        title: experienceForm.title.trim(),
        location: experienceForm.location.trim() || undefined,
        start_date: experienceForm.start_date,
        end_date: experienceForm.is_current
          ? null
          : experienceForm.end_date || null,
        is_current: Boolean(experienceForm.is_current),
        description: experienceForm.description.trim() || undefined,
      }
      const res = await workExperienceService.create(payload)
      const created = res.data
      setWorkExperiences((prev) => sortExperiences([created, ...prev]))
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              work_experiences: [created, ...(prev.work_experiences || [])],
            }
          : prev,
      )
      setExperienceToast('Work experience saved.')
      handleExperienceCancel()
    } catch (error) {
      setExperienceError(error?.message || 'Failed to save experience.')
      setExperienceSaving(false)
    }
  }

  const handleExperienceEditStart = (item) => {
    setExperienceError('')
    setEditingExperienceId(item.id)
    setEditingExperience({
      company: item.company || '',
      title: item.title || '',
      location: item.location || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_current: Boolean(item.is_current),
      description: item.description || '',
    })
  }

  const handleExperienceUpdate = async () => {
    if (!editingExperienceId || !editingExperience) return
    if (
      !editingExperience.company.trim() ||
      !editingExperience.title.trim() ||
      !editingExperience.start_date
    ) {
      setExperienceError('Company, title, and start date are required.')
      return
    }

    setExperienceSaving(true)
    setExperienceError('')
    try {
      const payload = {
        applicant: profileData?.id,
        company: editingExperience.company.trim(),
        title: editingExperience.title.trim(),
        location: editingExperience.location.trim() || undefined,
        start_date: editingExperience.start_date,
        end_date: editingExperience.is_current
          ? null
          : editingExperience.end_date || null,
        is_current: Boolean(editingExperience.is_current),
        description: editingExperience.description.trim() || undefined,
      }
      const res = await workExperienceService.update(editingExperienceId, payload)
      const updated = res.data
      setWorkExperiences((prev) =>
        sortExperiences(
          prev.map((item) => (item.id === updated.id ? updated : item)),
        ),
      )
      setExperienceToast('Work experience updated.')
      handleExperienceCancel()
    } catch (error) {
      setExperienceError(error?.message || 'Failed to update experience.')
      setExperienceSaving(false)
    }
  }

  const handleExperienceDelete = async (experienceId) => {
    const shouldDelete = window.confirm(
      'Delete this work experience? This cannot be undone.',
    )
    if (!shouldDelete) return
    try {
      await workExperienceService.remove(experienceId)
      setWorkExperiences((prev) =>
        prev.filter((item) => item.id !== experienceId),
      )
      setExperienceToast('Work experience deleted.')
      if (editingExperienceId === experienceId) {
        handleExperienceCancel()
      }
    } catch (error) {
      setExperienceError(error?.message || 'Failed to delete experience.')
    }
  }

  if (!profileLoaded) return <div className="px-6 pt-8">Loading profile...</div>

  if (!profileData) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <SectionHeading label="Profile" />
        <p className="text-slate-600">
          We couldn&apos;t load your student profile yet. This usually means your
          account isn&apos;t linked to a student profile.
        </p>
        {profileNotice && (
          <p className="mt-3 text-sm text-rose-500">{profileNotice}</p>
        )}
        <Link
          to="/register"
          className="mt-6 inline-flex items-center rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red"
        >
          Create student profile
        </Link>
      </div>
    )
  }

  return (
    <div className="codexhub-profile min-h-full bg-slate-50 pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading label="Profile" />
          <Link
            to="/codexhub/students"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-4 py-2 text-sm font-semibold text-brand-blue transition hover:border-brand-red/40 hover:bg-rose-50 hover:text-brand-red"
          >
            Back to Dashboard
          </Link>
        </div>
        {profileNotice && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {profileNotice}
          </div>
        )}
        <div className="mb-12">
          <div className="codexhub-profile-header flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:flex-row md:justify-between">
            <div className="codexhub-profile-header-info flex-1">
              <h1 className="text-4xl font-black text-brand-blue md:text-5xl">
                {fullName}
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                {profileData.headline ||
                  profileData.tags ||
                  'Full Stack Developer | React - Node - AWS'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-brand-blue px-3 py-1 text-sm font-semibold text-brand-blue">
                  Spring 2026 Cohort
                </span>
                <span className="rounded-full bg-emerald-100 p-3 text-sm font-semibold text-emerald-700">
                  Open to Work
                </span>
              </div>
            </div>
            <div className="codexhub-profile-header-actions flex flex-wrap gap-3 md:flex-col  md:gap-3 md:ml-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="codexhub-btn codexhub-btn--blue"
              >
                Edit Profile
              </button>
              <button
                onClick={handleUploadClick}
                className="codexhub-btn codexhub-btn--ghost"
              >
                <UploadIcon className="h-4 w-4" />
                {uploadState === 'loading' ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvUpload}
              className="hidden"
            />
            {uploadState === 'success' && (
              <p className="text-sm text-emerald-600">
                Resume uploaded successfully.
              </p>
            )}
            {uploadError && (
              <p className="text-sm text-rose-500">{uploadError}</p>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="codexhub-card rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <SectionHeading label="About" />
              <p className="text-slate-600 leading-relaxed">
                {profileData.summary ||
                  'Passionate full stack developer with experience building responsive web applications using React, Node.js, and AWS. Strong foundation in modern JavaScript and backend architecture.'}
              </p>
            </section>

            <SkillsSection
              skills={skills}
              newSkill={newSkill}
              onNewSkillChange={setNewSkill}
              onAddSkill={handleAddSkill}
              skillMenuId={skillMenuId}
              onToggleMenu={(id) =>
                setSkillMenuId(skillMenuId === id ? null : id)
              }
              onEditStart={handleEditSkillStart}
              onDelete={handleDeleteSkill}
              editingSkillId={editingSkillId}
              editingSkillValue={editingSkillValue}
              onEditValueChange={setEditingSkillValue}
              onEditSave={handleEditSkillSave}
              onEditCancel={() => {
                setEditingSkillId(null)
                setEditingSkillValue('')
              }}
            />

            <section className="codexhub-card rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <SectionHeading label="Projects" />
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-100 p-6">
                  <h3 className="font-bold text-brand-blue">Job Tracker App</h3>
                  <p className="mt-2 text-slate-600">
                    Full stack MERN application allowing users to track job
                    applications and hiring stages.
                  </p>
                  <div className="mt-4 flex gap-4 text-sm font-semibold">
                    <a href="#" className="flex items-center gap-1 text-brand-blue">
                      GitHub <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                    <a href="#" className="flex items-center gap-1 text-brand-blue">
                      Live Demo <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <WorkExperienceSection
              workExperiences={workExperiences}
              experienceToast={experienceToast}
              onAddClick={() => setIsAddingExperience(true)}
              isAdding={isAddingExperience}
              experienceForm={experienceForm}
              onExperienceChange={handleExperienceChange}
              onSaveNew={handleExperienceSave}
              onCancelNew={handleExperienceCancel}
              experienceError={experienceError}
              experienceSaving={experienceSaving}
              editingExperienceId={editingExperienceId}
              editingExperience={editingExperience}
              onEditChange={handleExperienceEditChange}
              onEditStart={handleExperienceEditStart}
              onEditSave={handleExperienceUpdate}
              onEditCancel={handleExperienceCancel}
              onDelete={handleExperienceDelete}
            />
          </div>

          <div className="space-y-8 lg:sticky lg:top-24">
            <section className="codexhub-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeading label="Contact" />
              <div className="space-y-3 text-sm text-slate-600">
                <p>{profileData.email}</p>
                <p>{profileData.phone || 'Add a phone number'}</p>
                <p>
                  {profileData.city || 'City'}, {profileData.state || 'State'}
                </p>
              </div>
            </section>

            <section className="codexhub-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeading label="Links" />
              <div className="space-y-3 text-sm font-medium">
                <a
                  href={profileData.portfolio_url || '#'}
                  className="block text-brand-blue"
                >
                  Portfolio Website
                </a>
                <a
                  href={profileData.linkedin_url || '#'}
                  className="block text-brand-blue"
                >
                  LinkedIn
                </a>
                <a href="#" className="block text-brand-blue">
                  GitHub
                </a>
              </div>
            </section>

            <section className="codexhub-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <SectionHeading label="Saved Jobs" />
              {savedJobs.length ? (
                <div className="space-y-3">
                  {savedJobs.slice(0, 4).map((job) => (
                    <div
                      key={job.id || job.title}
                      className="rounded-xl border border-slate-50 bg-slate-50/60 p-4"
                    >
                      <p className="font-bold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">
                        {job.company_name || 'Employer'} - {job.location || 'Remote'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Save jobs to keep track of roles you want to apply to later.
                </p>
              )}
              <Link
                to="/jobs"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red"
              >
                Browse jobs
              </Link>
            </section>

            <ApplicationsSection
              applications={applications}
              fallbackApplications={fallbackApplications}
              resolveJobTitle={resolveJobTitle}
              formatStage={formatStage}
            />
          </div>
        </div>

        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-6 backdrop-blur-sm md:items-center">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
              <div className="h-2 w-full bg-linear-to-r from-brand-red via-brand-blue to-brand-red" />
              <div className="max-h-[90vh] overflow-y-auto p-6 md:p-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-brand-blue">
                    Edit profile
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="rounded-full border border-slate-200/80 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-brand-red/40 hover:bg-rose-50 hover:text-brand-red"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    First name
                    <input
                      value={formState.first_name}
                      onChange={(event) =>
                        handleFieldChange('first_name', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Last name
                    <input
                      value={formState.last_name}
                      onChange={(event) =>
                        handleFieldChange('last_name', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Headline
                    <input
                      value={formState.headline}
                      onChange={(event) =>
                        handleFieldChange('headline', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Summary
                    <textarea
                      rows={5}
                      value={formState.summary}
                      onChange={(event) =>
                        handleFieldChange('summary', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                    <input
                      value={formState.email}
                      onChange={(event) =>
                        handleFieldChange('email', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Phone
                    <input
                      value={formState.phone}
                      onChange={(event) =>
                        handleFieldChange('phone', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    LinkedIn
                    <input
                      value={formState.linkedin_url}
                      onChange={(event) =>
                        handleFieldChange('linkedin_url', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Portfolio
                    <input
                      value={formState.portfolio_url}
                      onChange={(event) =>
                        handleFieldChange('portfolio_url', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    City
                    <input
                      value={formState.city}
                      onChange={(event) =>
                        handleFieldChange('city', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    State
                    <input
                      value={formState.state}
                      onChange={(event) =>
                        handleFieldChange('state', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Country
                    <input
                      value={formState.country}
                      onChange={(event) =>
                        handleFieldChange('country', event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </label>
                </div>

                {profileSaveError && (
                  <p className="mt-4 text-sm text-rose-500">
                    {profileSaveError}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-brand-blue px-6 py-3 font-semibold text-white transition hover:bg-[#E06C75]">
                    Save changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-lg border border-slate-200/80 px-6 py-3 font-semibold text-slate-600 transition hover:border-brand-red/40 hover:bg-rose-50 hover:text-brand-red"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
