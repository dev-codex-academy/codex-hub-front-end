import api from './api'

const instructorService = {
  getAll: () => api.get('/public/instructors/'),
}

export default instructorService
