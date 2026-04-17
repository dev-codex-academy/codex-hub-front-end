import { safeParseJSON } from '../utils/storage'

const KEY = 'savedJobs'

const savedJobsService = {
  getAll: () => {
    const parsed = safeParseJSON(localStorage.getItem(KEY), [])
    return Array.isArray(parsed) ? parsed : []
  },

  getSavedJobsLocal: () => savedJobsService.getAll(),

  isSaved: (jobId) => savedJobsService.getAll().some(j => j.id === jobId),

  save: (job) => {
    const current = savedJobsService.getAll()
    if (current.some(j => j.id === job.id)) return
    localStorage.setItem(KEY, JSON.stringify([job, ...current]))
  },

  remove: (jobId) => {
    const updated = savedJobsService.getAll().filter(j => j.id !== jobId)
    localStorage.setItem(KEY, JSON.stringify(updated))
  },

  toggle: (job) => {
    if (savedJobsService.isSaved(job.id)) {
      savedJobsService.remove(job.id)
      return false
    }
    savedJobsService.save(job)
    return true
  },
}

export default savedJobsService
