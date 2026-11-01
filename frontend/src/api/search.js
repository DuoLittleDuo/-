import api from './client'
import { withDemoFallback } from './demo'
import { localSearchProducts } from './localCatalog'

export const searchProducts = (params) =>
  withDemoFallback(
    () => api.get('/search', { params }).then((res) => res.data),
    () => localSearchProducts(params),
  )
