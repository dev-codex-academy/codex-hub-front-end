import api from './api'

const educationService = {
  getAll: (params) => api.get('/education/', { params }),
  getById: (id) => api.get(`/education/${id}/`),
  create: (data) => api.post('/education/', data),
  update: (id, data) => api.patch(`/education/${id}/`, data),
  remove: (id) => api.delete(`/education/${id}/`),
}

export default educationService
