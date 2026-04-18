import api from './api'

const employeeService = {
  getAll:   (params)    => api.get('/employees/', { params }),
  getById:  (id)        => api.get(`/employees/${id}/`),
  create:   (data)      => api.post('/employees/', data),
  update:   (id, data)  => api.patch(`/employees/${id}/`, data),
  remove:   (id)        => api.delete(`/employees/${id}/`),

  getMe:    ()          => api.get('/employees/me/'),
  updateMe: (data)      => api.patch('/employees/me/', data),
  uploadPhoto: (file) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api.post('/employees/me/upload-photo/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getMySkills:   ()           => api.get('/employees/me/skills/'),
  addMySkill:    (skill, level) => api.post('/employees/me/skills/add/', { skill, level }),
  removeMySkill: (id)         => api.delete(`/employees/me/skills/${id}/`),
}

export default employeeService
