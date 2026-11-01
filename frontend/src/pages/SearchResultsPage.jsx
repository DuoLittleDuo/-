import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { categories as fetchCategories, listProducts } from '../api/products'
import { searchProducts } from '../api/search'
import EmptyState from '../components/EmptyState'
import FilterBar from '../components/FilterBar'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import ProductCardSkeleton from '../components/ProductCardSkeleton'
import Reveal from '../components/Reveal'

const SUGGESTIONS = ['狗吃饭的碗', '猫咪喝水器皿', '宠物挂牌', '人宠同系']

const MODE_LABEL = {
  hybrid: 'AI 语义检索',
  keyword: '关键词兜底',
  local: '本地演示检索',
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category_id')
  const categoryId = categoryParam ? Number(categoryParam) : null
  const petType = searchParams.get('pet_type') || ''
  const sort = searchParams.get('sort') || 'hot'
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
    if (!query) {
      if (petType) params.pet_type = petType
      params.sort = sort
    }

    const request = query ? searchProducts({ ...params, q: query }) : listProducts(params)

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
  }, [query, categoryId, petType, sort, page])

  const activeCategory = useMemo(
    () => categoryList.find((item) => item.id === categoryId),
    [categoryList, categoryId],
  )

  const updateParams = (changes) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) params.delete(key)
      else params.set(key, String(value))
    })
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

  const mode = data?.mode
  const modeLabel = query ? MODE_LABEL[mode] || '检索' : null

  const heading = query || activeCategory?.name || '全部器物'
  const eyebrow = query ? 'COLLECTION SEARCH / 检索' : 'COLLECTION / 全部器物'

  const items = query
    ? (data?.items || []).map((item) => ({ product: item.product, meta: item }))
    : (data?.items || []).map((product) => ({ product, meta: null }))

  return (
    <div className="page-canvas min-h-screen">
      <div className="container-page pt-12 pb-20">
        <header>
          <p className="eyebrow">{eyebrow}</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-3xl text-display text-ink">
              {query ? `「${heading}」` : heading}
            </h1>

            {!loading && data ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-2 font-mono text-[11px] text-ink/45">
                <span>共 {data.total} 件</span>
                {query ? <span>耗时 {Math.round(data.took_ms)} ms</span> : null}
                {modeLabel ? <span className="text-clay/80">{modeLabel}</span> : null}
              </div>
            ) : null}
          </div>

          {query ? (
            <p className="mt-5 max-w-reading text-sm leading-7 text-ink/60">
              {mode === 'hybrid'
                ? '语义模型已理解你的表达，并按相关度排序。'
                : mode === 'local'
                  ? '当前为本地演示检索，使用关键词与同义词匹配。'
                  : '当前使用关键词兜底检索。'}
            </p>
          ) : null}
        </header>

        <div className="mt-10">
          <FilterBar
            categories={categoryList}
            categoryId={categoryId}
            petType={petType}
            sort={sort}
            showBrowseFilters={!query}
            onCategory={(value) => updateParams({ category_id: value })}
            onPetType={(value) => updateParams({ pet_type: value })}
            onSort={(value) => updateParams({ sort: value === 'hot' ? null : value })}
          />
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="border-y border-line px-1 py-6 text-sm text-clay">{error}</div>
          ) : items.length === 0 ? (
            <EmptyState
              mark="000"
              title="没有找到相关器物"
              description="换个说法试试，比如「狗吃饭的碗」「猫咪喝水器皿」，或者从上方类目里挑选。"
            >
              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTIONS.map((term) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="tag-pill transition hover:border-clay/50 hover:text-clay"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map(({ product, meta }, index) => (
                  <Reveal key={product.id} delay={Math.min(index, 6) * 40}>
                    <ProductCard product={product} meta={meta} index={index + 1 + (page - 1) * 12} />
                  </Reveal>
                ))}
              </div>
              <Pagination page={page} pages={data?.pages || 0} onChange={goPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
