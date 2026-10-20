import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { categories as fetchCategories, listProducts } from '../api/products'
import { searchProducts } from '../api/search'
import CategoryChips from '../components/CategoryChips'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'

const SUGGESTIONS = ['狗吃饭的碗', '猫咪喝水器皿', '宠物挂牌', '人宠同系']

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category_id')
  const categoryId = categoryParam ? Number(categoryParam) : null
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  const [categoryList, setCategoryList] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    let active = true
    fetchCategories()
      .then((items) => {
        if (active) setCategoryList(items)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError('')

    const params = { page, page_size: 12 }
    if (categoryId != null) params.category_id = categoryId

    const request = query
      ? searchProducts({ ...params, q: query })
      : listProducts(params)

    request
      .then((result) => {
        if (requestRef.current === requestId) setData(result)
      })
      .catch((err) => {
        if (requestRef.current === requestId) {
          setError(errorMessage(err, '搜索失败，请稍后重试'))
        }
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoading(false)
      })
  }, [query, categoryId, page])

  const activeCategory = useMemo(
    () => categoryList.find((item) => item.id === categoryId),
    [categoryList, categoryId],
  )

  const goPage = (nextPage) => {
    const params = new URLSearchParams(searchParams)
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const heading = query
    ? `「${query}」的搜索结果`
    : activeCategory
      ? activeCategory.name
      : '全部商品'

  const isSemantic = data?.mode === 'hybrid'
  const items = query
    ? (data?.items || []).map((item) => ({ product: item.product, meta: item }))
    : (data?.items || []).map((product) => ({ product, meta: null }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-wide text-ink/35">
            {query ? 'AI 语义检索' : activeCategory ? '按类目浏览' : '商品浏览'}
          </p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{heading}</h1>
        </div>

        {!loading && data ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink/40">
            <span>共 {data.total} 件</span>
            {query ? (
              <>
                <span>·</span>
                <span>耗时 {Math.round(data.took_ms)} ms</span>
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    isSemantic ? 'bg-celadon/15 text-celadon' : 'bg-gold/15 text-gold'
                  }`}
                >
                  {isSemantic ? 'AI 语义检索' : '关键词兜底'}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <CategoryChips categories={categoryList} activeId={categoryId} query={query} />
      </div>

      {query ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white/50 px-4 py-3 text-xs leading-6 text-ink/45">
          {isSemantic
            ? '语义模型已理解你的表达，并按相关度排序。'
            : '当前使用关键词兜底检索。'}
          {data?.items?.[0]?.match_reason ? (
            <span className="ml-1 text-ink/60">
              最匹配：{data.items[0].match_reason}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <Spinner label="正在检索" />
        ) : error ? (
          <div className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="没有找到相关陶器"
            description="换个说法试试，比如「狗吃饭的碗」「猫咪喝水器皿」，或者从上方类目里挑选。"
          >
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${encodeURIComponent(term)}`}
                  className="tag-pill transition hover:bg-clay/10 hover:text-clay"
                >
                  {term}
                </Link>
              ))}
            </div>
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(({ product, meta }) => (
                <ProductCard key={product.id} product={product} meta={meta} />
              ))}
            </div>
            <Pagination page={page} pages={data?.pages || 0} onChange={goPage} />
          </>
        )}
      </div>
    </div>
  )
}
