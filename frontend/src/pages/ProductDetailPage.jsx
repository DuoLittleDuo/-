import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { getProduct, relatedProducts } from '../api/products'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import ProductVisual from '../components/ProductVisual'
import QuantityStepper from '../components/QuantityStepper'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isFavorite, toggle } = useFavorites()
  const { add, items: cartItems, updateQuantity } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [relatedMode, setRelatedMode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [cartFeedback, setCartFeedback] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setProduct(null)
    setRelated([])
    setQuantity(1)
    setCartFeedback(null)

    getProduct(id)
      .then((data) => {
        if (!active) return
        setProduct(data)
        relatedProducts(id, 6)
          .then((result) => {
            if (!active) return
            setRelated(result.items || [])
            setRelatedMode(result.mode)
          })
          .catch(() => {})
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, '商品加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Spinner label="正在取器" />

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="🏺"
          title="没有找到这只陶器"
          description={error}
        >
          <Link to="/search" className="btn-primary">
            去逛逛其他陶器
          </Link>
        </EmptyState>
      </div>
    )
  }

  if (!product) return null

  const favorited = isFavorite(product.id)
  const specRows = [
    ['材质', product.material || '柘沟土陶'],
    ['工艺', product.craft || '手工制作'],
    ['适用宠物', product.pet_type],
    ['规格', product.spec_text || '以实物为准'],
  ]

  const handleAddToCart = async (buyNow = false) => {
    if (!product || product.stock <= 0) return
    setAdding(true)
    setCartFeedback(null)
    try {
      const existing = cartItems.find((item) => item.product.id === product.id)
      // 立即购买：把该商品数量改为当前选择数，再直接进入结算
      const cart =
        buyNow && existing
          ? await updateQuantity(existing.id, quantity)
          : await add(product.id, quantity)

      if (buyNow) {
        const cartItem = (cart.items || []).find(
          (item) => item.product.id === product.id,
        )
        navigate(cartItem ? `/checkout?ids=${cartItem.id}` : '/cart')
        return
      }
      setCartFeedback({
        type: 'success',
        text: `已加入购物车：${product.name} × ${quantity}`,
      })
    } catch (err) {
      setCartFeedback({
        type: 'error',
        text: errorMessage(err, '加入购物车失败，请稍后重试'),
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/40">
        <Link to="/" className="transition hover:text-clay">
          首页
        </Link>
        <span>/</span>
        <Link
          to={`/search?category_id=${product.category_id}`}
          className="transition hover:text-clay"
        >
          {product.category_name}
        </Link>
        <span>/</span>
        <span className="text-ink/60">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.02fr_1fr] lg:gap-12">
        <div className="mx-auto w-full max-w-[320px]">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60 shadow-card">
            <ProductVisual product={product} size="text-9xl" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[product.cover_emoji || '🏺', '🖐️', '🔥'].map((icon, index) => (
              <div
                key={`${icon}-${index}`}
                className="grid aspect-square place-items-center rounded-xl border border-ink/10 bg-white/50 text-2xl opacity-70"
              >
                {icon}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] tracking-wide text-ink/30">
            示意占位图 · 实物图片后续接入
          </p>
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5">
            {(product.tags || []).map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl leading-snug text-ink">{product.name}</h1>
          <p className="mt-2 text-sm text-ink/50">{product.subtitle}</p>

          <div className="mt-6 rounded-2xl border border-clay/15 bg-gradient-to-br from-sand/70 to-white/40 p-5">
            <div className="flex items-end gap-2">
              <span className="text-sm text-clay">¥</span>
              <span className="font-display text-4xl leading-none text-clay">{product.price}</span>
              {product.original_price ? (
                <span className="mb-1 text-sm text-ink/30 line-through">
                  ¥{product.original_price}
                </span>
              ) : null}
              <span className="mb-1 ml-auto text-[11px] text-ink/40">
                已售 {product.sales_count}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-ink/40">
              库存 {product.stock} 件 · 每件纹理略有不同
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs text-ink/45">数量</span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, product.stock)}
                onChange={setQuantity}
                disabled={product.stock <= 0}
              />
              <span className="text-[11px] text-ink/35">
                {product.stock > 0 ? `最多 ${product.stock} 件` : '暂时缺货'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={adding || product.stock <= 0}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {adding ? '处理中…' : product.stock > 0 ? '加入购物车' : '暂时缺货'}
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={adding || product.stock <= 0}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                立即购买
              </button>
              <button
                type="button"
                onClick={() => toggle(product.id).catch(() => {})}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  favorited
                    ? 'border-clay bg-clay text-cream hover:bg-clay-dark'
                    : 'border-clay/30 bg-white/70 text-clay hover:border-clay hover:bg-clay/5'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill={favorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
                {favorited ? '已收藏' : '收藏'}
              </button>
            </div>

            {cartFeedback ? (
              <p
                className={`mt-3 text-xs ${
                  cartFeedback.type === 'success' ? 'text-celadon' : 'text-clay'
                }`}
              >
                {cartFeedback.text}
                {cartFeedback.type === 'success' ? (
                  <Link to="/cart" className="ml-2 underline underline-offset-2">
                    去购物车结算 →
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>

          <dl className="mt-6 divide-y divide-ink/5 rounded-xl border border-ink/10 bg-white/50 px-4">
            {specRows.map(([label, value]) => (
              <div key={label} className="flex gap-4 py-3 text-xs">
                <dt className="w-20 shrink-0 text-ink/35">{label}</dt>
                <dd className="text-ink/65">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <h2 className="font-display text-lg text-ink">器物与纹样</h2>
            <p className="mt-2 text-sm leading-7 text-ink/55">{product.description}</p>
            <p className="mt-3 text-xs leading-6 text-ink/35">
              柘沟土陶取自泗水柘沟五色陶土，纹样沿用绞胎、窑变、刻花等传统工艺。每件器物经手工修坯与高温烧制，纹理会因窑火产生自然差异。
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink">你可能也喜欢</h2>
              <p className="mt-1 text-xs text-ink/45">
                {relatedMode === 'semantic'
                  ? '根据纹样与场景语义推荐'
                  : '同类目热门陶器'}
              </p>
            </div>
            <Link to="/search" className="text-xs text-clay hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((item) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                meta={
                  item.similarity != null
                    ? { similarity: item.similarity, match_reason: '相似陶器' }
                    : null
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
