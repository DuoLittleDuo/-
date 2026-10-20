import api from './client'

export const getCart = () => api.get('/cart').then((res) => res.data)

export const addItem = (productId, quantity = 1) =>
  api.post('/cart/items', { product_id: productId, quantity }).then((res) => res.data)

export const updateItem = (itemId, quantity) =>
  api.patch(`/cart/items/${itemId}`, { quantity }).then((res) => res.data)

export const removeItem = (itemId) =>
  api.delete(`/cart/items/${itemId}`).then((res) => res.data)

export const clearCart = () => api.delete('/cart').then((res) => res.data)
