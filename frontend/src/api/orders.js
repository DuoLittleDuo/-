import api from './client'

export const createOrder = (payload) =>
  api.post('/orders', payload).then((res) => res.data)

export const listOrders = (params) =>
  api.get('/orders', { params }).then((res) => res.data)

export const getOrder = (id) => api.get(`/orders/${id}`).then((res) => res.data)

export const payOrder = (id) => api.post(`/orders/${id}/pay`).then((res) => res.data)

export const completeOrder = (id) =>
  api.post(`/orders/${id}/complete`).then((res) => res.data)

export const cancelOrder = (id) =>
  api.post(`/orders/${id}/cancel`).then((res) => res.data)
