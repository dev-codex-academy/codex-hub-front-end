import api from './api'

const postService = {
  getAll:        (params) => api.get('/posts/', { params }),
  getOne:        (id)     => api.get(`/posts/${id}/`),
  create:        (data)   => api.post('/posts/', data),
  update:        (id, data) => api.patch(`/posts/${id}/`, data),
  remove:        (id)     => api.delete(`/posts/${id}/`),
  uploadImage:   (id, formData) =>
    api.post(`/posts/${id}/upload-image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  toggleLike:    (id)     => api.post(`/posts/${id}/toggle-like/`),
  getComments:   (id)     => api.get(`/posts/${id}/comments/`),
  addComment:    (id, data) => api.post(`/posts/${id}/comments/`, data),
}

export default postService
