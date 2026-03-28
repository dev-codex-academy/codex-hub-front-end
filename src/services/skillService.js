import api from './api'

const skillService = {
  getAll: (params) => api.get('/skills/', { params }),
  getById: (id) => api.get(`/skills/${id}/`),
  create: (data) => api.post('/skills/', data),
  update: (id, data) => api.patch(`/skills/${id}/`, data),
  remove: (id) => api.delete(`/skills/${id}/`),
}

export default skillService
