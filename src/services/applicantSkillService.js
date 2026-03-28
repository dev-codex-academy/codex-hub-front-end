import api from './api'

const applicantSkillService = {
  getAll: (params) => api.get('/applicant-skills/', { params }),
  create: (data) => api.post('/applicant-skills/', data),
  update: (id, data) => api.patch(`/applicant-skills/${id}/`, data),
  remove: (id) => api.delete(`/applicant-skills/${id}/`),
}

export default applicantSkillService
