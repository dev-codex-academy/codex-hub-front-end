import { useState } from 'react'
import { Heart, MapPinIcon, SendIcon, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import savedJobsService from './services/savedJobsService'

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState(() => savedJobsService.getAll())

  const handleRemove = (jobId) => {
    savedJobsService.remove(jobId)
    setJobs(savedJobsService.getAll())
  }

  return (
    <div className="codexhub-students">
      <div className="codexhub-container">
        <div className="codexhub-jobs-header">
          <div>
            <p className="codexhub-section-label">Saved Jobs</p>
            <h1 className="codexhub-title codexhub-title--sm">Your Saved Jobs</h1>
            <p className="codexhub-subtitle">Roles you've bookmarked to apply to later.</p>
          </div>
          <Link to="/codexhub/students" className="codexhub-btn codexhub-btn--ghost">
            Back to Dashboard
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="codexhub-card codexhub-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Heart size={40} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#475569', marginBottom: '8px' }}>No saved jobs yet</p>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px' }}>
              Browse open roles and tap the heart icon to save them here.
            </p>
            <Link to="/codexhub/jobs" className="codexhub-btn codexhub-btn--blue">
              Explore Jobs
            </Link>
          </div>
        ) : (
          <div className="codexhub-jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="codexhub-card codexhub-job">
                <div className="codexhub-job-header">
                  <h2>{job.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="codexhub-job-type">
                      {(job.job_type || 'role').replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleRemove(job.id)}
                      title="Remove from saved"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                        display: 'flex', alignItems: 'center', color: '#E06C75',
                      }}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
