/**
 * 演示模式的本地数据仓库（localStorage）。
 * 只服务未登录的「访客浏览」，与真实账号的 zgtc_token 完全隔离。
 */
import catalog from './catalog'
import { toCard } from '../api/localCatalog'

const STORE_KEY = 'zgtc_demo_state_v1'
const VERSION = 1

const STATUS_LABEL = {
  pending: '待支付',
  paid: '待收货',
  completed: '已完成',
  cancelled: '已取消',
}

const productsById = new Map(catalog.products.map((product) => [product.id, product]))

const nowIso = () => new Date().toISOString()

function snapshot(product, quantity) {
  return {
    product_id: product.id,
    sku: product.sku,
    product_name: product.name,
    price: product.price,
    quantity,
    cover_emoji: product.cover_emoji,
    theme_color: product.theme_color,
    subtotal: product.price * quantity,
  }
}

function seedState() {
  const cart = [
    { id: 1, product_id: 1, quantity: 1, created_at: nowIso() },
    { id: 2, product_id: 8, quantity: 2, created_at: nowIso() },
  ]

  const completedOrder = {
    id: 9001,
    order_no: 'DEMO-20260918-0001',
    status: 'completed',
    status_label: STATUS_LABEL.completed,
    total_amount: 0,
    total_quantity: 0,
    recipient_name: '演示访客',
    recipient_phone: '13800138000',
    shipping_address: '山东省济宁市泗水县柘沟镇演示路 1 号',
    remark: null,
    created_at: '2026-09-18T10:20:00+08:00',
    paid_at: '2026-09-18T10:26:00+08:00',
    cancelled_at: null,
    completed_at: '2026-09-21T16:05:00+08:00',
    items: [],
  }
  const pendingOrder = {
    id: 9002,
    order_no: 'DEMO-20261026-0002',
    status: 'pending',
    status_label: STATUS_LABEL.pending,
    total_amount: 0,
    total_quantity: 0,
    recipient_name: '演示访客',
    recipient_phone: '13800138000',
    shipping_address: '山东省济宁市泗水县柘沟镇演示路 1 号',
    remark: '周末送到即可',
    created_at: '2026-10-26T19:42:00+08:00',
    paid_at: null,
    cancelled_at: null,
    completed_at: null,
    items: [],
  }

  const seedOrder = (order, entries) => {
    order.items = entries.map(([productId, quantity]) => {
      const product = productsById.get(productId)
      return product ? snapshot(product, quantity) : null
    }).filter(Boolean)
    order.total_quantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
    order.total_amount = order.items.reduce((sum, item) => sum + item.subtotal, 0)
    return order
  }

  return {
    version: VERSION,
    cart,
    favorites: [3, 10, 17, 24],
    orders: [
      seedOrder(completedOrder, [
        [5, 1],
        [12, 1],
      ]),
      seedOrder(pendingOrder, [[2, 1]]),
    ],
    nextCartId: 3,
    nextOrderId: 9003,
  }
}

function readState() {
  if (typeof localStorage === 'undefined') return seedState()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = seedState()
      writeState(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw)
    if (parsed?.version !== VERSION) {
      const seeded = seedState()
      writeState(seeded)
      return seeded
    }
    return parsed
  } catch {
    return seedState()
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch {
    /* 隐私模式下静默失败，演示仍可用但不持久化 */
  }
  return state
}

function mutate(fn) {
  const state = readState()
  const result = fn(state)
  writeState(state)
  return result
}

export function resetDemoStore() {
  writeState(seedState())
}

/* ---------- 购物车 ---------- */

function cartItemView(item) {
  const product = productsById.get(item.product_id)
  if (!product) return null
  return {
    id: item.id,
    product: toCard(product),
    quantity: item.quantity,
    subtotal: product.price * item.quantity,
    created_at: item.created_at,
  }
}

function cartResponse(state) {
  const items = state.cart.map(cartItemView).filter(Boolean)
  return {
    items,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    total_amount: items.reduce((sum, item) => sum + item.subtotal, 0),
  }
}

export const demoCart = {
  get: () => cartResponse(readState()),

  add(productId, quantity = 1) {
    return mutate((state) => {
      const product = productsById.get(Number(productId))
      if (!product) throw new Error('商品不存在')
      const existing = state.cart.find((item) => item.product_id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.cart.push({
          id: state.nextCartId++,
          product_id: product.id,
          quantity,
          created_at: nowIso(),
        })
      }
      return cartResponse(state)
    })
  },

  update(itemId, quantity) {
    return mutate((state) => {
      const item = state.cart.find((entry) => entry.id === Number(itemId))
      if (item) item.quantity = Math.max(1, Number(quantity) || 1)
      return cartResponse(state)
    })
  },

  remove(itemId) {
    return mutate((state) => {
      state.cart = state.cart.filter((entry) => entry.id !== Number(itemId))
      return cartResponse(state)
    })
  },

  clear() {
    return mutate((state) => {
      state.cart = []
      return cartResponse(state)
    })
  },
}

/* ---------- 收藏 ---------- */

function favoriteView(state, productId) {
  const product = productsById.get(productId)
  if (!product) return null
  return {
    id: productId,
    created_at: '2026-10-01T09:00:00+08:00',
    product: toCard(product),
  }
}

export const demoFavorites = {
  ids: () => ({ product_ids: readState().favorites }),

  list({ page = 1, page_size = 12 } = {}) {
    const state = readState()
    const items = state.favorites.map((id) => favoriteView(state, id)).filter(Boolean)
    const total = items.length
    const pages = total ? Math.ceil(total / page_size) : 0
    const start = (page - 1) * page_size
    return {
      items: items.slice(start, start + page_size),
      total,
      page: Number(page),
      page_size: Number(page_size),
      pages,
    }
  },

  add(productId) {
    return mutate((state) => {
      const id = Number(productId)
      if (!state.favorites.includes(id)) state.favorites.unshift(id)
      return { product_id: id, favorited: true }
    })
  },

  remove(productId) {
    return mutate((state) => {
      state.favorites = state.favorites.filter((id) => id !== Number(productId))
      return null
    })
  },
}

/* ---------- 订单 ---------- */

export const demoOrders = {
  create(payload = {}) {
    return mutate((state) => {
      const ids = (payload.item_ids || []).map(Number)
      const picked = state.cart.filter((item) => ids.includes(item.id))
      const source = picked.length ? picked : state.cart

      const items = source
        .map((item) => {
          const product = productsById.get(item.product_id)
          return product ? snapshot(product, item.quantity) : null
        })
        .filter(Boolean)

      if (!items.length) throw new Error('购物车为空，无法下单')

      const consumedIds = source.map((item) => item.id)
      const order = {
        id: state.nextOrderId++,
        order_no: `DEMO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
          state.nextOrderId,
        ).padStart(4, '0')}`,
        status: 'pending',
        status_label: STATUS_LABEL.pending,
        total_amount: items.reduce((sum, item) => sum + item.subtotal, 0),
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        recipient_name: payload.recipient_name || '演示访客',
        recipient_phone: payload.recipient_phone || '',
        shipping_address: payload.shipping_address || '',
        remark: payload.remark || null,
        created_at: nowIso(),
        paid_at: null,
        cancelled_at: null,
        completed_at: null,
        items,
      }

      state.orders.unshift(order)
      state.cart = state.cart.filter((item) => !consumedIds.includes(item.id))
      return order
    })
  },

  list({ status, page = 1, page_size = 8 } = {}) {
    const state = readState()
    const filtered = status ? state.orders.filter((order) => order.status === status) : state.orders
    const total = filtered.length
    const pages = total ? Math.ceil(total / page_size) : 0
    const start = (page - 1) * page_size
    return {
      items: filtered.slice(start, start + page_size),
      total,
      page: Number(page),
      page_size: Number(page_size),
      pages,
    }
  },

  get(id) {
    return readState().orders.find((order) => order.id === Number(id)) || null
  },

  transition(id, nextStatus) {
    return mutate((state) => {
      const order = state.orders.find((entry) => entry.id === Number(id))
      if (!order) throw new Error('订单不存在')
      order.status = nextStatus
      order.status_label = STATUS_LABEL[nextStatus]
      if (nextStatus === 'paid') order.paid_at = nowIso()
      if (nextStatus === 'completed') order.completed_at = nowIso()
      if (nextStatus === 'cancelled') order.cancelled_at = nowIso()
      return order
    })
  },
}

export { STATUS_LABEL }
