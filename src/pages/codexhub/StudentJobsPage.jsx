import { useEffect, useState } from "react";
import {
  ExternalLinkIcon,
  MapPinIcon,
  X,
  BookmarkIcon,
  BriefcaseIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import publicJobService from "@/services/publicJobService";
import applicantService from "@/services/applicantService";
import jobApplicationService from "@/services/jobApplicationService";
import { SectionHeading } from "./components/SectionHeading";
import savedJobsService from "./services/savedJobsService";

export default function StudentJobsPage() {
  const ENABLE_STUDENT_APPLY = false;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyPrefillLoading, setApplyPrefillLoading] = useState(false);
  const [applicantId, setApplicantId] = useState("");
  const [applyForm, setApplyForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    cover_letter: "",
    resume_file: null,
  });

  const formatJobType = (jobType) => (jobType || "role").replace(/_/g, " ");

  const formatDate = (value) => {
    if (!value) return "Not listed";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const formatSalary = (job) => {
    const currency = job.salary_currency || "USD";
    const min = Number(job.salary_min);
    const max = Number(job.salary_max);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return "Not listed";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    if (Number.isFinite(min) && Number.isFinite(max))
      return `${formatter.format(min)} – ${formatter.format(max)}`;
    if (Number.isFinite(min)) return `${formatter.format(min)}+`;
    return `${formatter.format(max)} max`;
  };

  const openDetails = (job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const openApply = (job) => {
    setSelectedJob(job);
    setApplySubmitted(false);
    setApplyError("");
    setApplySubmitting(false);
    setApplyForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      linkedin_url: "",
      portfolio_url: "",
      cover_letter: "",
      resume_file: null,
    });
    setApplyOpen(true);
    setApplyPrefillLoading(true);
    applicantService
      .getMyProfile()
      .then((res) => {
        const profile = res?.data;
        if (!profile) return;
        setApplicantId(profile.id || "");
        setApplyForm((prev) => ({
          ...prev,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          linkedin_url: profile.linkedin_url || "",
          portfolio_url: profile.portfolio_url || "",
        }));
      })
      .catch(() => setApplicantId(""))
      .finally(() => setApplyPrefillLoading(false));
  };

  const handleApplyChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "resume_file") {
      setApplyForm((prev) => ({ ...prev, resume_file: files?.[0] || null }));
      return;
    }
    setApplyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplySubmit = async (event) => {
    event.preventDefault();
    setApplyError("");
    if (!selectedJob) return;
    if (!ENABLE_STUDENT_APPLY) {
      setApplySubmitted(true);
      return;
    }
    setApplySubmitting(true);
    try {
      let applicant = applicantId;
      if (applicant) {
        await applicantService.update(applicant, {
          first_name: applyForm.first_name,
          last_name: applyForm.last_name,
          email: applyForm.email,
          phone: applyForm.phone,
          linkedin_url: applyForm.linkedin_url,
          portfolio_url: applyForm.portfolio_url,
        });
      }
      if (applyForm.resume_file && applicant) {
        await applicantService.uploadMyCV(applicant, applyForm.resume_file);
      }
      await jobApplicationService.create({
        applicant,
        job: selectedJob.id,
        cover_letter: applyForm.cover_letter || "",
      });
      setApplySubmitted(true);
    } catch {
      setApplyError("We could not submit your application. Please try again.");
    } finally {
      setApplySubmitting(false);
    }
  };

  const toggleSaveJob = (job) => {
    const nextSaved = savedJobsService.toggleJobLocal(job);
    setJobs((prev) =>
      prev.map((item) =>
        item.id === job.id ? { ...item, _saved: nextSaved } : item,
      ),
    );
  };

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const res = await publicJobService.getAll({
          status: "open",
          ordering: "-posted_date",
        });
        const data = res.data?.results ?? res.data ?? [];
        const saved = savedJobsService.getSavedJobsLocal();
        const savedIds = new Set(saved.map((item) => item.id));
        const withSaved = data.map((job) => ({
          ...job,
          _saved: savedIds.has(job.id),
        }));
        setJobs(withSaved);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  return (
    <div className="cxjobs-page">
      <div className="cxjobs-container">
        {/* ── Page header ── */}
        <div className="cxjobs-page-header">
          <div>
            <p className="cxjobs-eyebrow">Opportunities</p>
            <h1 className="cxjobs-heading">Open Roles</h1>
            <p className="cxjobs-subheading">
              Browse open roles curated by CodeX Academy.
            </p>
          </div>
          <Link
            to="/codexhub/students"
            className="codexhub-btn codexhub-btn--ghost"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── Job grid ── */}
        {loading ? (
          <div className="cxjobs-empty-state">
            <div className="cxjobs-spinner" />
            <p>Loading opportunities…</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="cxjobs-empty-state">
            <BriefcaseIcon className="cxjobs-empty-icon" />
            <p className="cxjobs-empty-title">No open roles right now</p>
            <p className="cxjobs-empty-sub">
              Check back soon — new opportunities are added regularly.
            </p>
          </div>
        ) : (
          <div className="cxjobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="cxjobs-card">
                <div className="cxjobs-card-top">
                  <span className="cxjobs-type-badge">
                    {formatJobType(job.job_type)}
                  </span>
                  <button
                    type="button"
                    className={`cxjobs-save-btn ${
                      job._saved ? "is-saved" : ""
                    }`}
                    aria-label={job._saved ? "Remove saved job" : "Save job"}
                    aria-pressed={job._saved}
                    onClick={() => toggleSaveJob(job)}
                  >
                    <BookmarkIcon size={15} />
                  </button>
                </div>

                <h2 className="cxjobs-card-title">{job.title}</h2>
                <p className="cxjobs-card-company">
                  {job.company_name || job.display_company || "CodeX Academy"}
                </p>

                <div className="cxjobs-card-meta">
                  <MapPinIcon size={13} />
                  <span>
                    {job.location || (job.is_remote ? "Remote" : "Hybrid")}
                  </span>
                </div>

                <p className="cxjobs-card-desc">
                  {job.description ||
                    "View details to learn more about this opportunity."}
                </p>

                <div className="cxjobs-card-actions">
                  <button
                    type="button"
                    className="codexhub-btn codexhub-btn--ghost cxjobs-btn-sm"
                    onClick={() => openDetails(job)}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    className="codexhub-btn codexhub-btn--blue cxjobs-btn-sm"
                    onClick={() => openApply(job)}
                  >
                    Apply Now
                  </button>
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

      {/* ══════════════════════════════════════════
          Job Details Modal
      ══════════════════════════════════════════ */}
      {detailsOpen && selectedJob && (
        <div
          className="cxjobs-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailsOpen(false);
          }}
        >
          <div className="cxjobs-modal">
            <div className="cxjobs-modal-bar" />
            <div className="cxjobs-modal-header">
              <div>
                <h2 className="cxjobs-modal-title">
                  {selectedJob.title || selectedJob.position_display || "Role"}
                </h2>
                <p className="cxjobs-modal-company">
                  {selectedJob.company_name ||
                    selectedJob.display_company ||
                    "CodeX Academy"}
                </p>
              </div>
              <button
                className="cxjobs-modal-close"
                onClick={() => setDetailsOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cxjobs-modal-body">
              <div className="cxjobs-detail-meta">
                <div className="cxjobs-card-meta">
                  <MapPinIcon size={13} />
                  <span>
                    {selectedJob.location ||
                      (selectedJob.is_remote ? "Remote" : "Hybrid")}
                  </span>
                </div>
                <div className="cxjobs-detail-tags">
                  <span className="cxjobs-tag">
                    {formatJobType(selectedJob.job_type)}
                  </span>
                  <span className="cxjobs-tag">
                    Posted {formatDate(selectedJob.posted_date)}
                  </span>
                </div>
              </div>

              <div className="cxjobs-detail-grid">
                <div className="cxjobs-detail-item">
                  <span className="cxjobs-detail-label">Salary</span>
                  <span className="cxjobs-detail-value">
                    {formatSalary(selectedJob)}
                  </span>
                </div>
                <div className="cxjobs-detail-item">
                  <span className="cxjobs-detail-label">Headcount</span>
                  <span className="cxjobs-detail-value">
                    {selectedJob.headcount || 1}
                  </span>
                </div>
                {selectedJob.closing_date && (
                  <div className="cxjobs-detail-item">
                    <span className="cxjobs-detail-label">Closes</span>
                    <span className="cxjobs-detail-value">
                      {formatDate(selectedJob.closing_date)}
                    </span>
                  </div>
                )}
              </div>

              {[
                {
                  label: "Overview",
                  content:
                    selectedJob.description || "No description provided yet.",
                },
                selectedJob.responsibilities && {
                  label: "Responsibilities",
                  content: selectedJob.responsibilities,
                },
                selectedJob.requirements && {
                  label: "Requirements",
                  content: selectedJob.requirements,
                },
                selectedJob.benefits && {
                  label: "Benefits",
                  content: selectedJob.benefits,
                },
              ]
                .filter(Boolean)
                .map(({ label, content }) => (
                  <div key={label} className="cxjobs-detail-section">
                    <p className="cxjobs-detail-section-title">{label}</p>
                    <p className="cxjobs-detail-section-text">{content}</p>
                  </div>
                ))}
            </div>

            <div className="cxjobs-modal-footer">
              <button
                type="button"
                className="codexhub-btn codexhub-btn--ghost"
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </button>
              {selectedJob.external_url && (
                <a
                  href={selectedJob.external_url}
                  className="codexhub-btn codexhub-btn--blue"
                  target="_blank"
                  rel="noreferrer"
                >
                  External Link <ExternalLinkIcon size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Apply Modal
      ══════════════════════════════════════════ */}
      {applyOpen && selectedJob && (
        <div
          className="cxjobs-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApplyOpen(false);
          }}
        >
          <div className="cxjobs-modal">
            <div className="cxjobs-modal-bar" />
            <div className="cxjobs-modal-header">
              <div>
                <h2 className="cxjobs-modal-title">
                  Apply for {selectedJob.title || "Role"}
                </h2>
                <p className="cxjobs-modal-company">
                  {selectedJob.company_name ||
                    selectedJob.display_company ||
                    "CodeX Academy"}
                </p>
              </div>
              <button
                className="cxjobs-modal-close"
                onClick={() => setApplyOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="cxjobs-modal-body">
                <div className="cxjobs-apply-note">
                  This application form matches the backend fields and will
                  submit once student permissions are enabled.
                </div>

                {applyPrefillLoading && (
                  <p className="cxjobs-apply-loading">Loading your profile…</p>
                )}
                {applyError && (
                  <div className="cxjobs-apply-error">{applyError}</div>
                )}

                {!applySubmitted ? (
                  <div className="cxjobs-form">
                    <div className="cxjobs-form-row">
                      <label className="cxjobs-label">
                        First name
                        <input
                          className="cxjobs-input"
                          type="text"
                          name="first_name"
                          placeholder="Jane"
                          value={applyForm.first_name}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                          required
                        />
                      </label>
                      <label className="cxjobs-label">
                        Last name
                        <input
                          className="cxjobs-input"
                          type="text"
                          name="last_name"
                          placeholder="Doe"
                          value={applyForm.last_name}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                          required
                        />
                      </label>
                    </div>
                    <div className="cxjobs-form-row">
                      <label className="cxjobs-label">
                        Email address
                        <input
                          className="cxjobs-input"
                          type="email"
                          name="email"
                          placeholder="jane@example.com"
                          value={applyForm.email}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                          required
                        />
                      </label>
                      <label className="cxjobs-label">
                        Phone number
                        <input
                          className="cxjobs-input"
                          type="tel"
                          name="phone"
                          placeholder="+1 555 000 0000"
                          value={applyForm.phone}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                        />
                      </label>
                    </div>
                    <div className="cxjobs-form-row">
                      <label className="cxjobs-label">
                        LinkedIn URL
                        <input
                          className="cxjobs-input"
                          type="url"
                          name="linkedin_url"
                          placeholder="https://linkedin.com/in/…"
                          value={applyForm.linkedin_url}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                        />
                      </label>
                      <label className="cxjobs-label">
                        Portfolio URL
                        <input
                          className="cxjobs-input"
                          type="url"
                          name="portfolio_url"
                          placeholder="https://yoursite.com"
                          value={applyForm.portfolio_url}
                          onChange={handleApplyChange}
                          disabled={applySubmitting}
                        />
                      </label>
                    </div>
                    <label className="cxjobs-label cxjobs-label--full">
                      Resume{" "}
                      <span className="cxjobs-label-hint">
                        (PDF, DOC, DOCX)
                      </span>
                      <input
                        className="cxjobs-input cxjobs-input--file"
                        type="file"
                        name="resume_file"
                        onChange={handleApplyChange}
                        accept=".pdf,.doc,.docx"
                        disabled={applySubmitting}
                      />
                    </label>
                    <label className="cxjobs-label cxjobs-label--full">
                      Cover letter
                      <textarea
                        className="cxjobs-input cxjobs-input--textarea"
                        name="cover_letter"
                        placeholder="Tell us why you're a great fit…"
                        value={applyForm.cover_letter}
                        onChange={handleApplyChange}
                        disabled={applySubmitting}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="cxjobs-apply-success">
                    🎉 Thanks! Your application details are captured and ready
                    to submit.
                  </div>
                )}
              </div>

              <div className="cxjobs-modal-footer">
                <button
                  type="button"
                  className="codexhub-btn codexhub-btn--ghost"
                  onClick={() => setApplyOpen(false)}
                >
                  {applySubmitted ? "Close" : "Cancel"}
                </button>
                {selectedJob.external_url && !applySubmitted && (
                  <a
                    href={selectedJob.external_url}
                    className="codexhub-btn codexhub-btn--slate"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply Externally <ExternalLinkIcon size={14} />
                  </a>
                )}
                {!applySubmitted && (
                  <button
                    type="submit"
                    className="codexhub-btn codexhub-btn--blue"
                    disabled={applySubmitting}
                  >
                    {applySubmitting ? "Submitting…" : "Submit Application"}
                  </button>
                )}
                {applySubmitted && (
                  <button
                    type="button"
                    className="codexhub-btn codexhub-btn--blue"
                    onClick={() => setApplyOpen(false)}
                  >
                    Done
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


