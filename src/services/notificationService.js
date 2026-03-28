import api from './api'

const notificationService = {
  getAll: (params) => api.get('/notifications/', { params }),
  create: (data) => api.post('/notifications/', data),
  update: (id, data) => api.patch(`/notifications/${id}/`, data),
  remove: (id) => api.delete(`/notifications/${id}/`),
  markRead: (id) => api.post(`/notifications/${id}/mark-read/`),
  markAllRead: (applicantId) =>
    api.post(`/notifications/mark-all-read/?applicant=${applicantId}`),
}

export default notificationService
