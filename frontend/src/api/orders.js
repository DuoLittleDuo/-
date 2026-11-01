import api from './client'
import { localFirst } from './demo'
import { demoOrders } from '../data/demoStore'

export const createOrder = (payload) =>
  localFirst(
    () => demoOrders.create(payload),
    () => api.post('/orders', payload).then((res) => res.data),
  )

export const listOrders = (params) =>
  localFirst(
    () => demoOrders.list(params),
    () => api.get('/orders', { params }).then((res) => res.data),
  )

export const getOrder = (id) =>
  localFirst(
    () => {
      const order = demoOrders.get(id)
      if (!order) {
        const error = new Error('订单不存在')
        error.response = { status: 404, data: { detail: '订单不存在' } }
        throw error
      }
      return order
    },
    () => api.get(`/orders/${id}`).then((res) => res.data),
  )

export const payOrder = (id) =>
  localFirst(
    () => demoOrders.transition(id, 'paid'),
    () => api.post(`/orders/${id}/pay`).then((res) => res.data),
  )

export const completeOrder = (id) =>
  localFirst(
    () => demoOrders.transition(id, 'completed'),
    () => api.post(`/orders/${id}/complete`).then((res) => res.data),
  )

export const cancelOrder = (id) =>
  localFirst(
    () => demoOrders.transition(id, 'cancelled'),
    () => api.post(`/orders/${id}/cancel`).then((res) => res.data),
  )
