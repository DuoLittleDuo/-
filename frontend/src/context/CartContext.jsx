import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const applyCart = useCallback((data) => {
    setItems(data?.items || [])
  }, [])

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([])
      return null
    }
    setLoading(true)
    try {
      const data = await cartApi.getCart()
      applyCart(data)
      setError('')
      return data
    } catch (err) {
      setError('购物车加载失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token, applyCart])

  useEffect(() => {
    if (!token) {
      setItems([])
      setError('')
      return
    }
    refresh().catch(() => {})
  }, [token, refresh])

  const add = useCallback(
    async (productId, quantity = 1) => {
      const data = await cartApi.addItem(productId, quantity)
      applyCart(data)
      return data
    },
    [applyCart],
  )

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      const data = await cartApi.updateItem(itemId, quantity)
      applyCart(data)
      return data
    },
    [applyCart],
  )

  const remove = useCallback(
    async (itemId) => {
      const data = await cartApi.removeItem(itemId)
      applyCart(data)
      return data
    },
    [applyCart],
  )

  const clear = useCallback(async () => {
    const data = await cartApi.clearCart()
    applyCart(data)
    return data
  }, [applyCart])

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  const value = useMemo(
    () => ({
      items,
      count,
      totalAmount,
      loading,
      error,
      refresh,
      add,
      updateQuantity,
      remove,
      clear,
    }),
    [items, count, totalAmount, loading, error, refresh, add, updateQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart 必须在 CartProvider 内使用')
  return context
}
