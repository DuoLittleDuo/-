import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { cancelOrder, completeOrder, listOrders, payOrder } from '../api/orders'
import EmptyState from '../components/EmptyState'
import OrderStatusBadge from '../components/OrderStatusBadge'
import Pagination from '../components/Pagination'
import PetLetterModal from '../components/PetLetterModal'
import Spinner from '../components/Spinner'
import { formatDateTime } from '../utils/format'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || ''
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [letterOrder, setLetterOrder] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    listOrders({ status: status || undefined, page, page_size: 8 })
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, '订单加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [status, page, reloadKey])

  const selectTab = (key) => {
    const params = new URLSearchParams(searchParams)
    if (key === 'all') params.delete('status')
    else params.set('status', key)
    params.delete('page')
    setSearchParams(params)
  }

  const goPage = (nextPage) => {
    const params = new URLSearchParams(searchParams)
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const runAction = async (action, orderId) => {
    setActing(orderId)
    setError('')
    try {
      const updated = await action(orderId)
      setReloadKey((value) => value + 1)
      return updated
    } catch (err) {
      setError(errorMessage(err, '操作失败，请稍后重试'))
      return null
    } finally {
      setActing(null)
    }
  }

  const handlePay = async (order) => {
    const updated = await runAction(payOrder, order.id)
    if (updated?.status === 'paid') {
      setLetterOrder({ ...order, ...updated, items: updated.items ?? order.items })
    }
  }

  const emptyTitle =
    status === 'pending'
      ? '没有待支付的订单'
      : status === 'paid'
        ? '没有待收货的订单'
        : status === 'completed'
          ? '还没有已完成的订单'
          : status === 'cancelled'
            ? '没有已取消的订单'
            : '还没有订单'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-wide text-ink/35">MY ORDERS</p>
          <h1 className="mt-1 font-display text-3xl text-ink">我的订单</h1>
          <p className="mt-2 text-xs text-ink/45">
            {data ? `共 ${data.total} 笔订单` : '查看订单状态与物流进度'}
          </p>
        </div>
        <Link to="/search" className="text-xs text-clay hover:underline">
          继续挑选 →
        </Link>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-ink/10 bg-white/50 p-1">
        {TABS.map((tab) => {
          const active = (tab.key === 'all' && !status) || tab.key === status
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition ${
                active ? 'bg-clay text-cream shadow-sm' : 'text-ink/50 hover:text-clay'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="mt-5 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <Spinner label="正在整理订单" />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon="📦"
            title={emptyTitle}
            description="去挑选一只柘沟陶器，下单后可以在这里查看订单进度。"
          >
            <Link to="/search" className="btn-primary">
              去逛逛
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="space-y-4">
              {data.items.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-ink/10 bg-white/70 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/5 pb-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/40">
                      <span>订单号 {order.order_no}</span>
                      <span>{formatDateTime(order.created_at)}</span>
                    </div>
                    <OrderStatusBadge status={order.status} label={order.status_label} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-xl"
                          style={{ backgroundColor: `${item.theme_color || '#B85C38'}18` }}
                        >
                          {item.cover_emoji || '🏺'}
                        </div>
                        <div className="min-w-0 flex-1">
                          {item.product_id ? (
                            <Link
                              to={`/product/${item.product_id}`}
                              className="line-clamp-1 text-sm text-ink/75 transition hover:text-clay"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <span className="line-clamp-1 text-sm text-ink/60">
                              {item.product_name}
                            </span>
                          )}
                          <p className="mt-0.5 text-[11px] text-ink/35">
                            ¥{item.price} × {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-ink/60">¥{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3">
                    <p className="text-xs text-ink/45">
                      共 {order.total_quantity} 件，合计{' '}
                      <span className="text-base font-semibold text-clay">
                        ¥{order.total_amount}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/orders/${order.id}`} className="btn-ghost px-3 py-1.5 text-xs">
                        查看详情
                      </Link>
                      {order.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => runAction(cancelOrder, order.id)}
                            disabled={acting === order.id}
                            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
                          >
                            取消订单
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePay(order)}
                            disabled={acting === order.id}
                            className="btn-primary px-4 py-1.5 text-xs disabled:opacity-40"
                          >
                            {acting === order.id ? '处理中…' : '去支付'}
                          </button>
                        </>
                      ) : null}
                      {order.status === 'paid' ? (
                        <button
                          type="button"
                          onClick={() => runAction(completeOrder, order.id)}
                          disabled={acting === order.id}
                          className="btn-primary px-4 py-1.5 text-xs disabled:opacity-40"
                        >
                          {acting === order.id ? '处理中…' : '确认收货'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Pagination page={page} pages={data.pages} onChange={goPage} />
          </>
        )}
      </div>

      <PetLetterModal
        open={Boolean(letterOrder)}
        order={letterOrder}
        onClose={() => setLetterOrder(null)}
      />
    </div>
  )
}
