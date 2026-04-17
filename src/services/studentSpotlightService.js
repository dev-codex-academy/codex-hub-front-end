import api from './api'

const studentSpotlightService = {
  getAll:  (params)    => api.get('/student-spotlights/', { params }),
  getOne:  (id)        => api.get(`/student-spotlights/${id}/`),
  create:  (data)      => api.post('/student-spotlights/', data),
  update:  (id, data)  => api.patch(`/student-spotlights/${id}/`, data),
  remove:  (id)        => api.delete(`/student-spotlights/${id}/`),
}

export default studentSpotlightService
