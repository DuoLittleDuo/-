/**
 * 本地商品目录：结构与后端 /api/products、/api/search 返回保持一致，
 * 用于演示模式（后端不可用时仍能完整浏览）。
 */
import catalog from '../data/catalog'

const { categories: CATEGORIES, products: PRODUCTS } = catalog

const CARD_FIELDS = [
  'id',
  'sku',
  'name',
  'subtitle',
  'category_id',
  'category_name',
  'price',
  'original_price',
  'pet_type',
  'tags',
  'cover_emoji',
  'theme_color',
  'sales_count',
  'stock',
  'is_hot',
  'image_url',
]

export function toCard(product) {
  const card = {}
  CARD_FIELDS.forEach((key) => {
    card[key] = product[key] ?? null
  })
  return card
}

function toDetail(product) {
  return {
    ...toCard(product),
    description: product.description,
    material: product.material,
    craft: product.craft,
    spec_text: product.spec_text,
    created_at: product.created_at,
  }
}

const byId = new Map(PRODUCTS.map((product) => [product.id, product]))

function paginate(items, page = 1, pageSize = 12) {
  const total = items.length
  const pages = total ? Math.ceil(total / pageSize) : 0
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    pages,
  }
}

export function localCategories() {
  return CATEGORIES.map((category) => ({
    ...category,
    product_count: PRODUCTS.filter((product) => product.category_id === category.id).length,
  }))
}

function sortProducts(items, sort) {
  const list = [...items]
  if (sort === 'price_asc') return list.sort((a, b) => a.price - b.price || a.id - b.id)
  if (sort === 'price_desc') return list.sort((a, b) => b.price - a.price || b.id - a.id)
  if (sort === 'new') return list.sort((a, b) => b.id - a.id)
  return list.sort(
    (a, b) =>
      Number(b.is_hot) - Number(a.is_hot) ||
      b.hot_score - a.hot_score ||
      b.sales_count - a.sales_count ||
      a.id - b.id,
  )
}

export function localListProducts({ category_id, pet_type, sort = 'hot', page = 1, page_size = 12 } = {}) {
  let items = PRODUCTS
  if (category_id) items = items.filter((product) => product.category_id === Number(category_id))
  if (pet_type) items = items.filter((product) => product.pet_type === pet_type)
  const sorted = sortProducts(items, sort)
  return paginate(sorted.map(toCard), Number(page), Number(page_size))
}

export function localHotProducts(limit = 8) {
  return sortProducts(PRODUCTS.filter((product) => product.is_hot), 'hot')
    .slice(0, limit)
    .map(toCard)
}

export function localGetProduct(id) {
  const product = byId.get(Number(id))
  return product ? toDetail(product) : null
}

export function localRelatedProducts(id, limit = 6) {
  const product = byId.get(Number(id))
  if (!product) return { mode: 'category', items: [] }

  const pool = PRODUCTS.filter(
    (item) => item.id !== product.id && item.category_id === product.category_id,
  )
  const sorted = sortProducts(pool, 'hot').slice(0, limit)

  return {
    mode: 'category',
    items: sorted.map((item) => ({ product: toCard(item), similarity: null })),
  }
}

/* ---------- 本地检索：同义词 + 加权匹配 ---------- */

const SYNONYMS = {
  狗: '犬',
  狗狗: '犬',
  小狗: '犬',
  汪: '犬',
  犬: '犬',
  猫: '猫',
  猫咪: '猫',
  小猫: '猫',
  喵: '猫',
  饭盆: '食盆',
  饭碗: '食盆',
  食碗: '食盆',
  吃饭: '食盆',
  进食: '食盆',
  狗粮: '食盆',
  猫粮: '食盆',
  食盆: '食盆',
  喝水: '水碗',
  饮水器: '水碗',
  饮水: '水碗',
  水盆: '水碗',
  水碗: '水碗',
  挂牌: '挂牌',
  吊牌: '挂牌',
  名牌: '挂牌',
  身份牌: '挂牌',
  项圈: '挂牌',
  摆件: '摆件',
  案头: '摆件',
  桌面: '摆件',
  装饰: '摆件',
  纪念罐: '纪念罐',
  追思: '纪念罐',
  骨灰: '纪念罐',
  纪念: '纪念罐',
  主人杯: '人宠同系',
  主人碗: '人宠同系',
  同系: '人宠同系',
  人宠: '人宠同系',
  礼盒: '人宠同系',
  幼宠: '幼',
  幼猫: '幼',
  幼犬: '幼',
  大容量: '大容量',
  大号: '大容量',
}

const SYNONYM_KEYS = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length)

export function normalizeQuery(query) {
  return (query || '').toLowerCase().replace(/[\s，,。.、！!？?：:；;/\\|_\-]+/g, '')
}

function queryTerms(normalized) {
  const terms = new Set()
  if (normalized.length >= 2) terms.add(normalized)
  SYNONYM_KEYS.forEach((key) => {
    if (normalized.includes(key)) terms.add(SYNONYMS[key])
  })
  return [...terms]
}

function scoreProduct(product, terms) {
  const fields = [
    { text: product.name, weight: 4 },
    { text: product.category_name, weight: 4 },
    { text: (product.tags || []).join(' '), weight: 3 },
    { text: product.subtitle, weight: 2 },
    { text: `${product.craft} ${product.material}`, weight: 1 },
    { text: product.description, weight: 1 },
  ]

  let score = 0
  const matched = []

  terms.forEach((term) => {
    let hit = false
    fields.forEach((field) => {
      if (term && field.text && field.text.includes(term)) {
        score += field.weight
        hit = true
      }
    })
    if (hit) matched.push(term)
  })

  if (matched.includes('犬') && product.pet_type === '犬') score += 2
  if (matched.includes('猫') && product.pet_type === '猫') score += 2
  if (matched.includes('犬') && product.pet_type === '通用') score += 0.5
  if (matched.includes('猫') && product.pet_type === '通用') score += 0.5
  if (matched.includes('幼') && product.name.includes('幼')) score += 3

  return { score, matched }
}

export function localSearchProducts({
  q = '',
  category_id,
  page = 1,
  page_size = 12,
} = {}) {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const normalized = normalizeQuery(q)
  const terms = queryTerms(normalized)

  let pool = PRODUCTS
  if (category_id) pool = pool.filter((product) => product.category_id === Number(category_id))

  const scored = pool
    .map((product) => ({ product, ...scoreProduct(product, terms) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.product.hot_score - a.product.hot_score ||
        b.product.sales_count - a.product.sales_count,
    )

  const maxScore = scored[0]?.score || 1
  const items = scored.map((entry) => {
    const score = Math.min(1, entry.score / Math.max(maxScore, 6))
    return {
      product: toCard(entry.product),
      score: Math.round(score * 10000) / 10000,
      similarity: null,
      match_reason: entry.matched.length
        ? `命中「${entry.matched.slice(0, 3).join('」「')}」`
        : `同类目 · ${entry.product.category_name}`,
      matched_terms: entry.matched.slice(0, 6),
    }
  })

  const paged = paginate(items, Number(page), Number(page_size))
  const tookMs =
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started

  return {
    query: q,
    normalized_query: normalized,
    mode: 'local',
    semantic_ready: false,
    total: paged.total,
    page: paged.page,
    page_size: paged.page_size,
    pages: paged.pages,
    took_ms: Math.round(tookMs * 10) / 10,
    items: paged.items,
  }
}
