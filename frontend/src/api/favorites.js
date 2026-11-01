import api from './client'
import { localFirst } from './demo'
import { demoFavorites } from '../data/demoStore'

export const favoriteIds = () =>
  localFirst(
    () => demoFavorites.ids(),
    () => api.get('/favorites/ids').then((res) => res.data),
  )

export const listFavorites = (params) =>
  localFirst(
    () => demoFavorites.list(params),
    () => api.get('/favorites', { params }).then((res) => res.data),
  )

export const addFavorite = (productId) =>
  localFirst(
    () => demoFavorites.add(productId),
    () => api.post(`/favorites/${productId}`).then((res) => res.data),
  )

export const removeFavorite = (productId) =>
  localFirst(
    () => demoFavorites.remove(productId),
    () => api.delete(`/favorites/${productId}`),
  )
