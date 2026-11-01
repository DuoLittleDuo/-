import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { categories as fetchCategories, hotProducts } from '../api/products'
import CollectionIndex from '../components/CollectionIndex'
import ProductCard from '../components/ProductCard'
import ProductCardSkeleton from '../components/ProductCardSkeleton'
import ProductImage from '../components/ProductImage'
import Reveal from '../components/Reveal'
import SearchBar from '../components/SearchBar'
import SectionHead from '../components/SectionHead'
import { IconArrowRight } from '../components/icons'

const EXAMPLES = ['狗吃饭的碗', '猫咪喝水器皿', '给狗狗的陶瓷饭盆', '宠物纪念罐']

const STATS = [
  { value: '6000 年', label: '柘沟窑火未断' },
  { value: '5 类', label: '食、饮、牌、摆、念' },
  { value: '35 件', label: '每一件都只有一只' },
  { value: '1 只', label: '世上没有第二只一样' },
]

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
    <div className="page-canvas">
      {/* Hero */}
      <section className="container-page pb-16 pt-12 lg:pb-24 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <p className="eyebrow">NON-HERITAGE POTTERY × PET</p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-headline text-ink">
                把六千年柘沟土陶，
                <br />
                盛进它的<span className="text-clay">饭碗</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-md text-sm leading-7 text-ink/65">
                搜索你日常会说的话，比如「狗吃饭的碗」——AI
                会理解你的意思，从柘沟陶纹里找到合适的那一只。
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 max-w-lg">
                <SearchBar variant="editorial" />
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                {EXAMPLES.map((term, index) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="group inline-flex items-baseline gap-2 text-xs text-ink/55 transition duration-300 ease-silk hover:text-clay"
                  >
                    <span className="font-mono text-[10px] text-clay/60">
                      0{index + 1}
                    </span>
                    {term}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={180} className="relative">
            <div className="object-stage aspect-[5/6] overflow-hidden shadow-object">
              <ProductImage
                sku="ZG-SB-01"
                alt="山河绞胎犬用陶瓷食盆"
                priority
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="animate-clip-reveal"
              />
            </div>

            <div className="absolute -bottom-6 left-4 right-10 border border-line bg-cream/95 px-5 py-4 shadow-lift backdrop-blur-sm sm:right-auto sm:max-w-xs">
              <p className="exhibit-no">NO. 001 / 035</p>
              <p className="mt-2 font-display text-sm text-ink">山河绞胎 · 犬用陶瓷食盆</p>
              <p className="mt-1 text-micro text-ink/45">绞胎彩纹 · 五色陶土 · 口径 18cm</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 数字条 */}
      <section className="border-y border-line">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-9 sm:grid-cols-4">
          {STATS.map((item) => (
            <div key={item.label}>
              <p className="font-display text-xl text-ink sm:text-2xl">{item.value}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-ink/45">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 类目索引 */}
      <section className="container-page section-y">
        <SectionHead
          index="01"
          eyebrow="COLLECTIONS"
          title="五类器物，五段日常"
          description="从一口食盆开始，把土陶带进它每天的生活。悬停或点击查看每一类。"
          action="查看全部器物"
          actionTo="/search"
        />
        <div className="mt-12">
          <CollectionIndex categories={categoryList} />
        </div>
      </section>

      {/* 热销 */}
      <section className="container-page pb-section">
        <SectionHead
          index="02"
          eyebrow="SELECTED WORKS"
          title="被带走最多的器物"
          description="已被许多宠主带回家的柘沟陶器，每一件都带着不同的窑火痕迹。"
          action="全部商品"
          actionTo="/search"
        />

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <p className="border-y border-line py-6 text-sm text-clay">{error}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hotList.map((product, index) => (
                <Reveal key={product.id} delay={Math.min(index, 6) * 40}>
                  <ProductCard product={product} index={index + 1} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI 检索 */}
      <section className="border-y border-line bg-ink text-paper">
        <div className="container-page grid gap-12 py-section-sm lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow text-gold/80">AI SEMANTIC SEARCH</p>
            <h2 className="mt-5 text-section text-paper">你说的话，它听得懂</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-paper/60">
              不要求你记住商品名。输入「给狗狗的陶瓷饭盆」，语义模型会在商品中找出真正的食盆，而不是简单匹配字面。
            </p>

            <div className="mt-8 border-t border-paper/15 pt-5">
              <p className="text-[11px] tracking-[0.2em] text-paper/35">试试说</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {EXAMPLES.map((term) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="group inline-flex items-center gap-1.5 border-b border-paper/20 pb-0.5 text-xs text-paper/70 transition hover:border-gold hover:text-gold"
                  >
                    {term}
                    <IconArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-paper/10 border-y border-paper/10">
            {AI_STEPS.map((item) => (
              <div key={item.step} className="flex items-start gap-6 py-5">
                <span className="font-mono text-micro tracking-[0.2em] text-gold/70">{item.step}</span>
                <div>
                  <p className="text-sm text-paper/85">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-paper/45">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 四种手艺 */}
      <section className="container-page section-y">
        <SectionHead
          index="03"
          eyebrow="CRAFT"
          title="柘沟的四种手艺"
          description="每一道纹理，都来自柘沟窑火的偶然与必然。"
        />

        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {CRAFT_FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 60} className="border-t border-line pt-5">
              <p className="font-mono text-micro tracking-[0.2em] text-clay/60">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-4 font-display text-xl text-ink">{feature.title}</h3>
              <p className="mt-2 text-xs leading-6 text-ink/55">{feature.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
