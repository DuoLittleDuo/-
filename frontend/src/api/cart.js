import api from './client'
import { isGuestDemo, localFirst } from './demo'
import { demoCart } from '../data/demoStore'

export const getCart = () =>
  localFirst(
    () => demoCart.get(),
    () => api.get('/cart').then((res) => res.data),
  )

export const addItem = (productId, quantity = 1) =>
  localFirst(
    () => demoCart.add(productId, quantity),
    () => api.post('/cart/items', { product_id: productId, quantity }).then((res) => res.data),
  )

export const updateItem = (itemId, quantity) =>
  localFirst(
    () => demoCart.update(itemId, quantity),
    () => api.patch(`/cart/items/${itemId}`, { quantity }).then((res) => res.data),
  )

export const removeItem = (itemId) =>
  localFirst(
    () => demoCart.remove(itemId),
    () => api.delete(`/cart/items/${itemId}`).then((res) => res.data),
  )

export const clearCart = () =>
  localFirst(
    () => demoCart.clear(),
    () => api.delete('/cart').then((res) => res.data),
  )

export { isGuestDemo }
