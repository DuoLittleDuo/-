import api from './client'

export const favoriteIds = () => api.get('/favorites/ids').then((res) => res.data)

export const listFavorites = (params) =>
  api.get('/favorites', { params }).then((res) => res.data)

export const addFavorite = (productId) =>
  api.post(`/favorites/${productId}`).then((res) => res.data)

export const removeFavorite = (productId) => api.delete(`/favorites/${productId}`)
