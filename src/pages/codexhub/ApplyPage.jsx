import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPinIcon, BriefcaseIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import publicJobService from '@/services/publicJobService'
import jobApplicationService from '@/services/jobApplicationService'
import applicantService from '@/services/applicantService'

export default function ApplyPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [job, setJob] = useState(null)
  const [jobLoading, setJobLoading] = useState(true)
  const [jobError, setJobError] = useState('')

  const [applicantId, setApplicantId] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [existingApplication, setExistingApplication] = useState(false)

  // If not authenticated, save pending job and redirect to login
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      localStorage.setItem('pending_apply_job', jobId)
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, authLoading, jobId, navigate])

  // Load job details
  useEffect(() => {
    if (!jobId) return
    publicJobService.getById(jobId)
      .then(res => setJob(res.data))
      .catch(() => setJobError('Job not found or no longer available.'))
      .finally(() => setJobLoading(false))
  }, [jobId])

  // Load applicant profile once authenticated
  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    setProfileLoading(true)
    applicantService.getMyProfile()
      .then(res => {
        setApplicantId(res.data.id)
        // Check for existing application
        return jobApplicationService.getAll({ applicant: res.data.id, job: jobId })
          .then(appRes => {
            const apps = appRes.data?.results ?? appRes.data ?? []
            if (apps.length > 0) setExistingApplication(true)
          })
          .catch(() => {})
      })
      .catch(err => {
        if (err?.response?.status === 404) {
          setProfileError('no-profile')
        } else {
          setProfileError('error')
        }
      })
      .finally(() => setProfileLoading(false))
  }, [isAuthenticated, authLoading, jobId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!applicantId) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await jobApplicationService.create({
        applicant: applicantId,
        job: Number(jobId),
        cover_letter: coverLetter,
      })
      setSubmitted(true)
    } catch (err) {
      const detail = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Could not submit application. Please try again.'
      setSubmitError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || jobLoading) {
    return (
      <div className="codexhub-students">
        <div className="codexhub-container">
          <div className="codexhub-card codexhub-empty">Loading…</div>
        </div>
      </div>
    )
  }

  if (jobError) {
    return (
      <div className="codexhub-students">
        <div className="codexhub-container">
          <div className="codexhub-card codexhub-empty">{jobError}</div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="codexhub-students">
        <div className="codexhub-container">
          <div className="codexhub-card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: '48px 32px' }}>
            <CheckCircleIcon style={{ width: 52, height: 52, color: '#16a34a', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>
              Application submitted!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
              You've successfully applied to <strong>{job?.title}</strong>
              {job?.display_company ? ` at ${job.display_company}` : ''}. We'll be in touch.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/codexhub/jobs" className="codexhub-btn codexhub-btn--ghost">
                Browse more jobs
              </Link>
              <Link to="/codexhub/profile" className="codexhub-btn codexhub-btn--blue">
                View my profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="codexhub-students">
      <div className="codexhub-container" style={{ maxWidth: 680 }}>
        {/* Back */}
        <Link
          to="/codexhub/jobs"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none', marginBottom: 24 }}
        >
          <ArrowLeftIcon style={{ width: 16, height: 16 }} />
          Back to jobs
        </Link>

        {/* Job summary card */}
        {job && (
          <div className="codexhub-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div className="codexhub-icon codexhub-icon--orange" style={{ flexShrink: 0, marginBottom: 0 }}>
                <BriefcaseIcon />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  {job.title}
                </h1>
                <p className="codexhub-job-company" style={{ margin: '0 0 8px' }}>
                  {job.display_company || job.company_name || 'CodeX Academy'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {job.location && (
                    <span className="codexhub-job-meta">
                      <MapPinIcon />
                      {job.location}
                    </span>
                  )}
                  {job.job_type && (
                    <span className="codexhub-job-type">{job.job_type.replace('_', ' ')}</span>
                  )}
                </div>
                {job.description && (
                  <p className="codexhub-job-desc" style={{ marginTop: 10 }}>{job.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application form */}
        <div className="codexhub-card">
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
            Your Application
          </h2>

          {existingApplication && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#854d0e' }}>
              You've already applied to this position. Check your{' '}
              <Link to="/codexhub/profile" style={{ color: '#854d0e', fontWeight: 700 }}>profile</Link>{' '}
              to see the status.
            </div>
          )}

          {profileLoading && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Loading your profile…</p>
          )}

          {profileError === 'no-profile' && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '16px', marginBottom: 20, fontSize: 14, color: '#be123c' }}>
              Your account doesn't have a student profile yet.{' '}
              <Link to="/codexhub/profile" style={{ color: '#be123c', fontWeight: 700 }}>
                Create your profile
              </Link>{' '}
              before applying.
            </div>
          )}

          {profileError === 'error' && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#be123c' }}>
              Could not load your profile. Please try again.
            </div>
          )}

          {submitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Cover Letter <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this role…"
                rows={6}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '2px solid #e2e8f0',
                  padding: '12px 14px',
                  fontSize: 14,
                  color: '#1e293b',
                  background: '#f8fafc',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = '#4E89BD'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                disabled={!applicantId || existingApplication || submitting}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={!applicantId || existingApplication || submitting || !!profileError}
                className="codexhub-btn codexhub-btn--blue"
                style={{
                  border: 'none',
                  cursor: (!applicantId || existingApplication || submitting || !!profileError) ? 'not-allowed' : 'pointer',
                  opacity: (!applicantId || existingApplication || submitting || !!profileError) ? 0.6 : 1,
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
              <Link to="/codexhub/profile" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
                Update my profile first
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
