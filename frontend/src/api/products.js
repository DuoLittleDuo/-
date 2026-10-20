import api from './client'

export const categories = () => api.get('/categories').then((res) => res.data)

export const listProducts = (params) =>
  api.get('/products', { params }).then((res) => res.data)

export const hotProducts = (limit = 8) =>
  api.get('/products/hot', { params: { limit } }).then((res) => res.data)

export const getProduct = (id) => api.get(`/products/${id}`).then((res) => res.data)

export const relatedProducts = (id, limit = 6) =>
  api.get(`/products/${id}/related`, { params: { limit } }).then((res) => res.data)
