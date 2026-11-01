import api from './client'
import { withDemoFallback } from './demo'
import {
  localCategories,
  localGetProduct,
  localHotProducts,
  localListProducts,
  localRelatedProducts,
} from './localCatalog'

export const categories = () =>
  withDemoFallback(
    () => api.get('/categories').then((res) => res.data),
    () => localCategories(),
  )

export const listProducts = (params) =>
  withDemoFallback(
    () => api.get('/products', { params }).then((res) => res.data),
    () => localListProducts(params),
  )

export const hotProducts = (limit = 8) =>
  withDemoFallback(
    () => api.get('/products/hot', { params: { limit } }).then((res) => res.data),
    () => localHotProducts(limit),
  )

export const getProduct = (id) =>
  withDemoFallback(
    () => api.get(`/products/${id}`).then((res) => res.data),
    () => {
      const product = localGetProduct(id)
      if (!product) {
        const error = new Error('商品不存在或已下架')
        error.response = { status: 404, data: { detail: '商品不存在或已下架' } }
        throw error
      }
      return product
    },
  )

export const relatedProducts = (id, limit = 6) =>
  withDemoFallback(
    () => api.get(`/products/${id}/related`, { params: { limit } }).then((res) => res.data),
    () => localRelatedProducts(id, limit),
  )
