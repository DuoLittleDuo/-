import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { cancelOrder, completeOrder, getOrder, payOrder } from '../api/orders'
import EmptyState from '../components/EmptyState'
import OrderStatusBadge from '../components/OrderStatusBadge'
import PetLetterModal from '../components/PetLetterModal'
import ProductImage from '../components/ProductImage'
import Spinner from '../components/Spinner'
import { formatDateTime } from '../utils/format'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const justCreated = searchParams.get('created') === '1'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [letterOrder, setLetterOrder] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    getOrder(id)
      .then((data) => {
        if (active) setOrder(data)
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
  }, [id, reloadKey])

  const runAction = async (action) => {
    if (!order) return null
    setActing(true)
    setError('')
    try {
      const updated = await action(order.id)
      setOrder(updated)
      return updated
    } catch (err) {
      setError(errorMessage(err, '操作失败，请稍后重试'))
      return null
    } finally {
      setActing(false)
    }
  }

  const handlePay = async () => {
    const updated = await runAction(payOrder)
    if (updated?.status === 'paid') setLetterOrder(updated)
  }

  if (loading) return <Spinner label="正在读取订单" />

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState icon="📦" title="订单不存在" description={error}>
          <Link to="/orders" className="btn-primary">
            返回我的订单
          </Link>
        </EmptyState>
      </div>
    )
  }

  const steps = [
    { label: '提交订单', time: order.created_at, done: true },
    {
      label: '支付',
      time: order.paid_at,
      done: order.status === 'paid' || order.status === 'completed',
    },
    { label: '完成', time: order.completed_at, done: order.status === 'completed' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1.5 text-[11px] text-ink/40">
        <Link to="/orders" className="transition hover:text-clay">
          我的订单
        </Link>
        <span>/</span>
        <span className="text-ink/60">订单详情</span>
      </nav>

      {justCreated && order.status === 'pending' ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-frame border border-celadon/20 bg-celadon/10 px-4 py-3 text-sm text-celadon">
          <span className="text-base">✓</span>
          下单成功。演示站不接入真实支付，可在下方点击「模拟支付」继续流程。
        </div>
      ) : null}

      {justCreated && order.status !== 'pending' ? (
        <div className="mt-4 rounded-frame border border-celadon/20 bg-celadon/10 px-4 py-3 text-sm text-celadon">
          下单成功，订单状态已更新。
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-frame bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      ) : null}

      <section className="mt-5 rounded-frame border border-line bg-paper/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-wide text-ink/35">订单号 {order.order_no}</p>
            <h1 className="mt-1 font-display text-2xl text-ink">订单详情</h1>
            <p className="mt-1 text-xs text-ink/40">下单时间 {formatDateTime(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} label={order.status_label} />
        </div>

        {order.status === 'cancelled' ? (
          <div className="mt-5 rounded-frame border border-line bg-ink/5 px-4 py-3 text-sm text-ink/50">
            该订单已于 {formatDateTime(order.cancelled_at)} 取消，库存已恢复。
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-frame border px-4 py-3 ${
                  step.done
                    ? 'border-clay/20 bg-clay/5'
                    : 'border-line bg-paper/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                      step.done ? 'bg-clay text-cream' : 'bg-ink/10 text-ink/35'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`text-sm ${step.done ? 'text-ink/75' : 'text-ink/35'}`}>
                    {step.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-ink/30">
                  {step.time ? formatDateTime(step.time) : '等待中'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-frame border border-line bg-paper/60 p-5">
            <h2 className="font-display text-lg text-ink">商品清单</h2>
            <div className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden">
                    <ProductImage sku={item.sku} alt={item.product_name} sizes="56px" />
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
                      <p className="line-clamp-1 text-sm text-ink/60">{item.product_name}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink/35">
                      ¥{item.price} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm text-ink/60">¥{item.subtotal}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-frame border border-line bg-paper/60 p-5">
            <h2 className="font-display text-lg text-ink">收货信息</h2>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink/35">收货人</dt>
                <dd className="text-ink/65">{order.recipient_name}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink/35">电话</dt>
                <dd className="text-ink/65">{order.recipient_phone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-ink/35">地址</dt>
                <dd className="leading-5 text-ink/65">{order.shipping_address}</dd>
              </div>
              {order.remark ? (
                <div className="flex gap-3">
                  <dt className="w-16 shrink-0 text-ink/35">备注</dt>
                  <dd className="leading-5 text-ink/65">{order.remark}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <aside className="h-fit rounded-frame border border-line bg-paper/60 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg text-ink">金额</h2>
          <div className="mt-4 space-y-2 text-xs text-ink/50">
            <div className="flex justify-between">
              <span>商品合计</span>
              <span className="text-ink/70">¥{order.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span>运费</span>
              <span className="text-celadon">包邮（演示）</span>
            </div>
            <div className="flex justify-between">
              <span>商品件数</span>
              <span>{order.total_quantity} 件</span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <span className="text-xs text-ink/45">应付</span>
            <span className="text-clay">
              <span className="text-xs">¥</span>
              <span className="ml-0.5 font-display text-3xl">{order.total_amount}</span>
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {order.status === 'pending' ? (
              <>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={acting}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {acting ? '处理中…' : '模拟支付'}
                </button>
                <button
                  type="button"
                  onClick={() => runAction(cancelOrder)}
                  disabled={acting}
                  className="btn-ghost w-full disabled:opacity-40"
                >
                  取消订单
                </button>
              </>
            ) : null}

            {order.status === 'paid' ? (
              <button
                type="button"
                onClick={() => runAction(completeOrder)}
                disabled={acting}
                className="btn-primary w-full disabled:opacity-40"
              >
                {acting ? '处理中…' : '确认收货'}
              </button>
            ) : null}

            <Link to="/orders" className="btn-ghost w-full">
              返回订单列表
            </Link>
          </div>

          <p className="mt-3 text-[10px] leading-4 text-ink/30">
            本期为功能演示，支付与收货均为模拟操作。
          </p>
        </aside>
      </div>

      <PetLetterModal
        open={Boolean(letterOrder)}
        order={letterOrder}
        onClose={() => setLetterOrder(null)}
      />
    </div>
  )
}
