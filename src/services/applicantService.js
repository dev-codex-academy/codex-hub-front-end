import api from './api'

const applicantService = {
  getAll: (params) => api.get('/applicants/', { params }),
  getById: (id) => api.get(`/applicants/${id}/`),
  create: (data) => api.post('/applicants/', data),
  update: (id, data) => api.patch(`/applicants/${id}/`, data),
  remove: (id) => api.delete(`/applicants/${id}/`),

  uploadPhoto: (id, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/applicants/${id}/upload-photo/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadCV: (id, file) => {
    const formData = new FormData()
    formData.append('cv', file)
    return api.post(`/applicants/${id}/upload-cv/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Returns { download_url, expires_in } — redirect user to download_url
  downloadCV: (id) =>
    api.get(`/applicants/${id}/cv-download/`),

  // Self-service: logged-in applicant's own profile via /api/applicants/me/
  getMyProfile: () => api.get('/applicants/me/'),

  updateMyProfile: (data) => api.patch('/applicants/me/', data),

  uploadMyPhoto: (id, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/applicants/${id}/upload-photo/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadMyCV: (id, file) => {
    const formData = new FormData()
    formData.append('cv', file)
    return api.post(`/applicants/${id}/upload-cv/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default applicantService
