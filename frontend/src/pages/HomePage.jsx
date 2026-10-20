import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { categories as fetchCategories, hotProducts } from '../api/products'
import CategoryChips from '../components/CategoryChips'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'
import Spinner from '../components/Spinner'

const EXAMPLES = ['狗吃饭的碗', '猫咪喝水器皿', '给狗狗的陶瓷饭盆', '宠物纪念罐']

const CRAFT_FEATURES = [
  { title: '五色陶土', desc: '青红黄白黑，天然成色' },
  { title: '绞胎彩纹', desc: '纹理入胎，一器一面' },
  { title: '窑变纹理', desc: '入窑一色，出窑万彩' },
  { title: '刻花', desc: '手工刻绘，柘沟旧纹' },
]

const AI_STEPS = [
  { step: '01', title: '理解意图', desc: '识别宠物、场景与器物类型' },
  { step: '02', title: '语义匹配', desc: '中文向量模型找到真正的相关商品' },
  { step: '03', title: '混合排序', desc: '语义相似度与关键词共同决定顺序' },
]

export default function HomePage() {
  const [categoryList, setCategoryList] = useState([])
  const [hotList, setHotList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchCategories(), hotProducts(8)])
      .then(([categoriesData, hotData]) => {
        if (!active) return
        setCategoryList(categoriesData)
        setHotList(hotData)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, '首页加载失败，请稍后重试'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/5">
        <span className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full border border-clay/10 bg-clay/5" />
        <span className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full border border-celadon/10 bg-celadon/5" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-clay/20 bg-white/60 px-3 py-1 text-[11px] tracking-wide text-clay">
              非遗土陶 · 宠物经济 · AI 语义检索
            </span>

            <h1 className="mt-6 font-display text-4xl leading-tight text-ink sm:text-5xl">
              把六千年柘沟土陶，
              <br />
              <span className="text-clay">盛进它的饭碗</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-ink/55">
              搜索你日常会说的话，比如「狗吃饭的碗」——AI
              会理解你的意思，从柘沟陶纹里找到合适的那一只。
            </p>

            <div className="mt-8">
              <SearchBar />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-ink/40">
              <span>试试：</span>
              {EXAMPLES.map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-ink/10 bg-white/60 px-2.5 py-1 transition hover:border-clay/40 hover:text-clay"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-ink">按场景挑选</h2>
              <p className="mt-1 text-xs text-ink/45">从一口食盆开始，把土陶带进日常</p>
            </div>
            <Link to="/search" className="shrink-0 text-xs text-clay hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="mt-4">
            <CategoryChips categories={categoryList} />
          </div>
        </section>

        {loading ? (
          <Spinner label="正在备窑" />
        ) : error ? (
          <div className="mt-10 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
        ) : (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink">热销推荐</h2>
                <p className="mt-1 text-xs text-ink/45">已被许多宠主带回家的柘沟陶器</p>
              </div>
              <Link to="/search" className="shrink-0 text-xs text-clay hover:underline">
                全部商品 →
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hotList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 overflow-hidden rounded-2xl bg-ink px-6 py-9 text-cream sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="text-[10px] tracking-[0.3em] text-gold">AI SEMANTIC SEARCH</span>
              <h2 className="mt-3 font-display text-2xl">你说的话，它听得懂</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-cream/60">
                不要求你记住商品名。输入「给狗狗的陶瓷饭盆」，语义模型会在商品中找出真正的食盆，而不是简单匹配字面。
              </p>
            </div>

            <div className="grid gap-2.5">
              {AI_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-xl border border-cream/10 bg-cream/5 px-4 py-3"
                >
                  <span className="font-display text-lg text-gold/70">{item.step}</span>
                  <div>
                    <p className="text-sm text-cream/85">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-cream/40">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 pb-4">
          <h2 className="font-display text-2xl text-ink">柘沟的四种手艺</h2>
          <p className="mt-1 text-xs text-ink/45">每一道纹理，都来自柘沟窑火的偶然与必然</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CRAFT_FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-xl border border-ink/10 bg-white/60 p-5 transition hover:border-clay/25"
              >
                <span className="font-display text-sm text-clay/45">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display text-lg text-ink">{feature.title}</h3>
                <p className="mt-1 text-xs text-ink/45">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
