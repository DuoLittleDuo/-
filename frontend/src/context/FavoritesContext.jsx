import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as favoritesApi from '../api/favorites'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { token, canBrowse } = useAuth()
  const [ids, setIds] = useState(() => new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    if (!canBrowse) {
      setIds(new Set())
      return undefined
    }

    setLoading(true)
    favoritesApi
      .favoriteIds()
      .then((data) => {
        if (active) setIds(new Set(data.product_ids || []))
      })
      .catch(() => {
        // 收藏状态加载失败不阻塞页面
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [canBrowse, token])

  const isFavorite = useCallback((productId) => ids.has(productId), [ids])

  const toggle = useCallback(
    async (productId) => {
      const currentlyFavorite = ids.has(productId)

      setIds((previous) => {
        const next = new Set(previous)
        if (currentlyFavorite) next.delete(productId)
        else next.add(productId)
        return next
      })

      try {
        if (currentlyFavorite) await favoritesApi.removeFavorite(productId)
        else await favoritesApi.addFavorite(productId)
      } catch (error) {
        setIds((previous) => {
          const next = new Set(previous)
          if (currentlyFavorite) next.add(productId)
          else next.delete(productId)
          return next
        })
        throw error
      }
    },
    [ids],
  )

  const remove = useCallback(async (productId) => {
    setIds((previous) => {
      const next = new Set(previous)
      next.delete(productId)
      return next
    })
    try {
      await favoritesApi.removeFavorite(productId)
    } catch (error) {
      setIds((previous) => {
        const next = new Set(previous)
        next.add(productId)
        return next
      })
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({ ids, count: ids.size, loading, isFavorite, toggle, remove }),
    [ids, loading, isFavorite, toggle, remove],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites 必须在 FavoritesProvider 内使用')
  return context
}
