import { useEffect, useState } from 'react'
import { ExternalLinkIcon, MapPinIcon, SendIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import publicJobService from '@/services/publicJobService'

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      try {
        const res = await publicJobService.getAll({ status: 'open', ordering: '-posted_date' })
        const data = res.data?.results ?? res.data ?? []
        setJobs(data)
      } catch {
        setJobs([])
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  return (
    <div className="codexhub-students">
      <div className="codexhub-container">
        <div className="codexhub-jobs-header">
          <div>
            <p className="codexhub-section-label">Jobs</p>
            <h1 className="codexhub-title codexhub-title--sm">Open Opportunities</h1>
            <p className="codexhub-subtitle">Browse open roles curated by CodeX Academy.</p>
          </div>
          <Link to="/codexhub/students" className="codexhub-btn codexhub-btn--ghost">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="codexhub-card codexhub-empty">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="codexhub-card codexhub-empty">No open jobs right now. Check back soon.</div>
        ) : (
          <div className="codexhub-jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="codexhub-card codexhub-job">
                <div className="codexhub-job-header">
                  <h2>{job.title}</h2>
                  <span className="codexhub-job-type">
                    {(job.job_type || 'role').replace('_', ' ')}
                  </span>
                </div>
                <p className="codexhub-job-company">
                  {job.company_name || job.display_company || 'CodeX Academy'}
                </p>
                <div className="codexhub-job-meta">
                  <MapPinIcon />
                  <span>{job.location || (job.is_remote ? 'Remote' : 'Hybrid')}</span>
                </div>
                <p className="codexhub-job-desc">
                  {job.description || 'View details to learn more about this opportunity.'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <Link to={`/apply/${job.id}`} className="codexhub-btn codexhub-btn--blue">
                    Apply <SendIcon />
                  </Link>
                  {job.external_url && (
                    <a href={job.external_url} className="codexhub-btn codexhub-btn--ghost" target="_blank" rel="noreferrer">
                      Details <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
