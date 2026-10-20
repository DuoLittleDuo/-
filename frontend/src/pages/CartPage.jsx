import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import EmptyState from '../components/EmptyState'
import ProductVisual from '../components/ProductVisual'
import QuantityStepper from '../components/QuantityStepper'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, loading, error, refresh, updateQuantity, remove } = useCart()

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [actionError, setActionError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const itemIdsKey = useMemo(() => items.map((item) => item.id).join(','), [items])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    setSelectedIds(new Set(items.map((item) => item.id)))
    // 只在购物车条目增删时重置选择，改数量时不打断用户
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey])

  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0)
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  const toggleItem = (itemId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const handleQuantity = async (item, quantity) => {
    setUpdatingId(item.id)
    setActionError('')
    try {
      await updateQuantity(item.id, quantity)
    } catch (err) {
      setActionError(errorMessage(err, '修改数量失败'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (itemId) => {
    setActionError('')
    try {
      await remove(itemId)
    } catch (err) {
      setActionError(errorMessage(err, '移除失败，请稍后重试'))
    }
  }

  const goCheckout = () => {
    if (selectedItems.length === 0) return
    navigate(`/checkout?ids=${selectedItems.map((item) => item.id).join(',')}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-wide text-ink/35">SHOPPING CART</p>
          <h1 className="mt-1 font-display text-3xl text-ink">购物车</h1>
          <p className="mt-2 text-xs text-ink/45">
            {items.length > 0 ? `共 ${items.length} 种陶器` : '把喜欢的陶器先放进来'}
          </p>
        </div>
        <Link to="/search" className="shrink-0 text-xs text-clay hover:underline">
          继续挑选 →
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">
          {actionError}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <Spinner label="正在整理购物车" />
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="🧺"
            title="购物车还是空的"
            description="去挑一只食盆、水碗或挂牌，让柘沟的陶土进入它的日常。"
          >
            <Link to="/search" className="btn-primary">
              去挑选陶器
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/50 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink/55">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-[#B85C38]"
                />
                全选
              </label>
              <span className="text-[11px] text-ink/35">库存以商品详情为准</span>
            </div>

            {items.map((item) => {
              const product = item.product
              const checked = selectedIds.has(item.id)

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white/70 p-4 transition ${
                    checked ? 'border-clay/25' : 'border-ink/10'
                  }`}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      className="mt-7 h-4 w-4 shrink-0 accent-[#B85C38] sm:mt-8"
                      aria-label={`选择 ${product.name}`}
                    />

                    <Link
                      to={`/product/${product.id}`}
                      className="w-20 shrink-0 overflow-hidden rounded-xl sm:w-24"
                    >
                      <ProductVisual product={product} size="text-3xl" showBadge={false} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/product/${product.id}`}
                            className="line-clamp-1 font-display text-base text-ink transition hover:text-clay"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 line-clamp-1 text-xs text-ink/45">
                            {product.subtitle}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink/35">
                            <span>{product.pet_type}</span>
                            <span>·</span>
                            <span>库存 {product.stock}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="shrink-0 text-[11px] text-ink/30 transition hover:text-clay"
                        >
                          移除
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-clay">
                          <span className="text-xs">¥</span>
                          <span className="ml-0.5 text-lg font-semibold">{product.price}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <QuantityStepper
                            value={item.quantity}
                            max={Math.max(1, product.stock)}
                            size="sm"
                            disabled={updatingId === item.id}
                            onChange={(next) => handleQuantity(item, next)}
                          />
                          <span className="w-14 text-right text-sm font-medium text-ink/65">
                            ¥{item.subtotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-ink/10 bg-white/70 p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg text-ink">结算</h2>
            <div className="mt-4 space-y-2 text-xs text-ink/50">
              <div className="flex justify-between">
                <span>已选商品</span>
                <span>{selectedQuantity} 件</span>
              </div>
              <div className="flex justify-between">
                <span>商品合计</span>
                <span className="text-ink/70">¥{selectedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>运费</span>
                <span className="text-celadon">包邮（演示）</span>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-ink/10 pt-4">
              <span className="text-xs text-ink/45">应付</span>
              <span className="text-clay">
                <span className="text-xs">¥</span>
                <span className="ml-0.5 font-display text-3xl">{selectedTotal}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={goCheckout}
              disabled={selectedItems.length === 0}
              className="btn-primary mt-4 w-full disabled:opacity-40"
            >
              去结算
            </button>
            <p className="mt-3 text-[10px] leading-4 text-ink/30">
              本期为演示站，结算后可模拟支付，不会产生真实交易。
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
