import api from './api'

const taService = {
  // Hours logs (class hours + task review)
  getHoursLogs:    (params) => api.get('/ta/hours-logs/', { params }),
  createHoursLog:  (data)   => api.post('/ta/hours-logs/', data),
  updateHoursLog:  (id, data) => api.patch(`/ta/hours-logs/${id}/`, data),
  deleteHoursLog:  (id)     => api.delete(`/ta/hours-logs/${id}/`),

  // Mentorships
  getMentorships:   (params) => api.get('/ta/mentorships/', { params }),
  createMentorship: (data)   => api.post('/ta/mentorships/', data),
  updateMentorship: (id, data) => api.patch(`/ta/mentorships/${id}/`, data),
  deleteMentorship: (id)     => api.delete(`/ta/mentorships/${id}/`),
}

export default taService
