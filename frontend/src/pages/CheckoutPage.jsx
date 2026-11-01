import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getCart } from '../api/cart'
import { createOrder } from '../api/orders'
import EmptyState from '../components/EmptyState'
import ProductVisual from '../components/ProductVisual'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const idsParam = searchParams.get('ids') || ''
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refresh: refreshCart } = useCart()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    recipient_name: user?.display_name || user?.username || '',
    recipient_phone: '',
    shipping_address: '',
    remark: '',
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')

    getCart()
      .then((data) => {
        if (!active) return
        const all = data.items || []
        const ids = idsParam
          .split(',')
          .map((value) => Number(value))
          .filter((value) => value > 0)
        setItems(ids.length > 0 ? all.filter((item) => ids.includes(item.id)) : all)
      })
      .catch((err) => {
        if (active) setLoadError(errorMessage(err, '加载结算商品失败'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [idsParam])

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  const updateField = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.recipient_name.trim() || !form.recipient_phone.trim() || !form.shipping_address.trim()) {
      setError('请填写收货人、联系电话和收货地址')
      return
    }
    if (items.length === 0) {
      setError('没有可结算的商品，请返回购物车重新选择')
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrder({
        recipient_name: form.recipient_name.trim(),
        recipient_phone: form.recipient_phone.trim(),
        shipping_address: form.shipping_address.trim(),
        remark: form.remark.trim() || null,
        item_ids: items.map((item) => item.id),
      })
      await refreshCart().catch(() => {})
      navigate(`/orders/${order.id}?created=1`, { replace: true })
    } catch (err) {
      setError(errorMessage(err, '下单失败，请稍后重试'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="正在核对订单" />

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState icon="🧾" title="结算信息加载失败" description={loadError}>
          <Link to="/cart" className="btn-primary">
            返回购物车
          </Link>
        </EmptyState>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="🧺"
          title="没有可结算的商品"
          description="购物车中未找到本次要结算的陶器，可能已经下单或已被移除。"
        >
          <Link to="/cart" className="btn-primary">
            返回购物车
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-1.5 text-[11px] text-ink/40">
        <Link to="/cart" className="hover:text-clay">
          购物车
        </Link>
        <span>/</span>
        <span className="text-ink/60">确认订单</span>
      </nav>

      <h1 className="mt-3 font-display text-3xl text-ink">确认订单</h1>
      <p className="mt-2 text-xs text-ink/45">填写收货信息，下单后可模拟支付。</p>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-frame border border-line bg-paper/60 p-5 sm:p-6">
            <h2 className="font-display text-lg text-ink">收货信息</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-ink/60">
                收货人
                <input
                  value={form.recipient_name}
                  onChange={updateField('recipient_name')}
                  className="input-base mt-1.5"
                  placeholder="请输入收货人姓名"
                  maxLength={50}
                />
              </label>
              <label className="block text-xs font-medium text-ink/60">
                联系电话
                <input
                  type="tel"
                  value={form.recipient_phone}
                  onChange={updateField('recipient_phone')}
                  className="input-base mt-1.5"
                  placeholder="请输入手机号"
                  maxLength={20}
                />
              </label>
              <label className="block text-xs font-medium text-ink/60 sm:col-span-2">
                收货地址
                <textarea
                  value={form.shipping_address}
                  onChange={updateField('shipping_address')}
                  className="input-base mt-1.5 min-h-20 resize-none"
                  placeholder="省 / 市 / 区县 / 详细地址"
                  maxLength={255}
                  rows={3}
                />
              </label>
              <label className="block text-xs font-medium text-ink/60 sm:col-span-2">
                订单备注（可选）
                <input
                  value={form.remark}
                  onChange={updateField('remark')}
                  className="input-base mt-1.5"
                  placeholder="例如：希望礼盒包装、刻宠物名字等"
                  maxLength={255}
                />
              </label>
            </div>
          </section>

          <section className="rounded-frame border border-line bg-paper/60 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">商品清单</h2>
              <span className="text-[11px] text-ink/35">共 {totalQuantity} 件</span>
            </div>

            <div className="mt-4 divide-y divide-line">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-16 shrink-0 overflow-hidden rounded-frame">
                    <ProductVisual product={item.product} size="text-2xl" showBadge={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm text-ink/75">{item.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink/35">
                      ¥{item.product.price} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-ink/65">¥{item.subtotal}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-frame border border-line bg-paper/60 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg text-ink">支付明细</h2>
          <div className="mt-4 space-y-2 text-xs text-ink/50">
            <div className="flex justify-between">
              <span>商品合计</span>
              <span className="text-ink/70">¥{totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>运费</span>
              <span className="text-celadon">包邮（演示）</span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <span className="text-xs text-ink/45">应付</span>
            <span className="text-clay">
              <span className="text-xs">¥</span>
              <span className="ml-0.5 font-display text-3xl">{totalAmount}</span>
            </span>
          </div>

          {error ? (
            <p className="mt-4 rounded-frame bg-clay/10 px-3 py-2 text-xs leading-5 text-clay">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
            {submitting ? '正在下单…' : '提交订单'}
          </button>
          <p className="mt-3 text-[10px] leading-4 text-ink/30">
            演示站不接入真实支付。提交订单后可在订单详情中模拟支付与确认收货。
          </p>
        </aside>
      </form>
    </div>
  )
}
