import api from './client'

export const searchProducts = (params) =>
  api.get('/search', { params }).then((res) => res.data)
