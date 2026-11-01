import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AssistantWidget from '../components/AssistantWidget'
import Header from '../components/Header'
import ProductImage from '../components/ProductImage'
import Reveal from '../components/Reveal'
import SiteFooter from '../components/SiteFooter'
import { IconArrowRight } from '../components/icons'
import { useAuth } from '../context/AuthContext'

const TICKER = [
  { sku: 'ZG-SB-01', name: '山河绞胎 · 犬用食盆' },
  { sku: 'ZG-SW-01', name: '流纹绞胎 · 蓄水碗' },
  { sku: 'ZG-GP-01', name: '刻花骨朵 · 宠物名牌' },
  { sku: 'ZG-BJ-01', name: '窑变釉 · 卧猫摆件' },
  { sku: 'ZG-JN-01', name: '窑变星河 · 纪念罐' },
  { sku: 'ZG-SB-07', name: '同纹主人杯与猫碗' },
  { sku: 'ZG-SW-03', name: '窑变天青 · 猫咪饮水器' },
  { sku: 'ZG-BJ-06', name: '窑变星河 · 猫月摆件' },
]

const CATEGORIES = [
  { sku: 'ZG-SB-01', en: 'FOOD BOWL', name: '宠物食盆', desc: '深口弧壁，盛住每一口' },
  { sku: 'ZG-SW-01', en: 'WATER BOWL', name: '宠物水碗', desc: '底重心低，清水更稳' },
  { sku: 'ZG-GP-01', en: 'ID TAG', name: '宠物挂牌', desc: '刻上名字，走远也认得出' },
  { sku: 'ZG-BJ-01', en: 'ORNAMENT', name: '桌面摆件', desc: '把它睡着的样子留在案头' },
  { sku: 'ZG-JN-01', en: 'MEMORIAL', name: '纪念陶罐', desc: '把想念，留在窑火里' },
]

const MOMENTS = [
  {
    time: '06:30',
    title: '晨 · 第一口',
    caption: '清晨的第一口，是一天里最安稳的开场。',
    sku: 'ZG-SB-07',
    alt: '主人马克杯与猫用浅口碗同纹成对',
    offset: '',
  },
  {
    time: '13:00',
    title: '午 · 一碗清水',
    caption: '暑气正盛，水要凉一点，碗要稳一点。',
    sku: 'ZG-SW-01',
    alt: '流纹绞胎自动蓄水陶碗',
    offset: 'lg:mt-12',
  },
  {
    time: '21:40',
    title: '夜 · 等门',
    caption: '天黑了，它把下巴搁在窝边，等你回家。',
    sku: 'ZG-BJ-01',
    alt: '窑变釉卧猫陶摆件',
    offset: '',
  },
]

const CRAFTS = [
  { title: '五色陶土', desc: '青、红、黄、白、黑，天然成色' },
  { title: '绞胎成纹', desc: '两色陶土反复揉叠，纹理长进胎骨' },
  { title: '窑变无双', desc: '入窑一色，出窑万彩，不听人的话' },
  { title: '手工刻花', desc: '柘沟旧纹，被一刀一刀刻进器身' },
]

const STATS = [
  { value: '6000 年', label: '柘沟窑火未断' },
  { value: '5 色', label: '青红黄白黑，天然成土' },
  { value: '1 只', label: '世上没有第二只一样的' },
]

function TickerRow({ hidden = false }) {
  return (
    <div className="flex shrink-0 gap-5 pr-5" aria-hidden={hidden || undefined}>
      {TICKER.map((item) => (
        <figure key={item.sku} className="w-32 shrink-0 sm:w-36">
          <div className="object-stage overflow-hidden">
            <div className="aspect-[4/5] w-full">
              <ProductImage
                sku={item.sku}
                alt={item.name}
                sizes="150px"
                className="transition-transform duration-700 ease-silk hover:scale-[1.03]"
              />
            </div>
          </div>
          <figcaption className="mt-2 truncate text-[10px] text-ink/45">{item.name}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export default function WelcomePage() {
  const location = useLocation()
  const { token, booting, canBrowse } = useAuth()
  const marqueeRef = useRef(null)

  const signedIn = Boolean(token) && !booting
  const from = location.state?.from || '/'
  const authState = { from }
  const primaryHref = canBrowse ? '/' : '/register'
  const primaryLabel = signedIn ? '继续为它挑选' : canBrowse ? '进入展馆' : '进去挑一只'

  useEffect(() => {
    const node = marqueeRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => node.setAttribute('data-paused', entry.isIntersecting ? 'false' : 'true'),
      { threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page-canvas min-h-screen">
      <Header variant="welcome" />

      {/* Hero */}
      <section className="container-page pb-16 pt-12 lg:pb-24 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <Reveal>
              <p className="eyebrow">泗水柘沟 · 六千年窑火</p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-headline text-ink">
                六千年窑火，
                <br />
                盛进它的<span className="text-clay">这一只碗</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-lg text-sm leading-7 text-ink/65 sm:text-[15px]">
                青、红、黄、白、黑，五种柘沟陶土在窑火里自然成纹。每一只碗、每一只罐，都带着无法复制的纹路——像它，也像你们一起过的日子。
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={primaryHref}
                  state={signedIn ? undefined : authState}
                  className="btn-primary"
                >
                  {primaryLabel}
                </Link>
                {signedIn ? (
                  <a href="#categories" className="btn-ghost">
                    看看五类器物
                  </a>
                ) : (
                  <Link to="/login" state={authState} className="btn-ghost">
                    已有账号，登录
                  </Link>
                )}
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex items-start gap-8 border-t border-line pt-6">
                {STATS.map((item) => (
                  <div key={item.label}>
                    <p className="font-display text-base text-ink sm:text-lg">{item.value}</p>
                    <p className="mt-1 text-[10px] leading-4 text-ink/45">{item.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={180} className="relative">
            <div className="object-stage relative ml-auto w-[92%] overflow-hidden rounded-t-[999px]">
              <div className="aspect-[4/5] w-full">
                <ProductImage
                  sku="ZG-SB-01"
                  alt="山河绞胎犬用陶瓷食盆，窗边植物旁"
                  priority
                  sizes="(min-width: 1024px) 44vw, 92vw"
                  className="animate-clip-reveal"
                />
              </div>
            </div>

            <div className="absolute bottom-4 left-0 max-w-[210px] border border-line bg-cream/95 px-4 py-3 shadow-lift backdrop-blur-sm">
              <p className="exhibit-no">NO. 001 / 035</p>
              <p className="mt-2 font-display text-xs leading-5 text-ink">
                山河绞胎 · 犬用陶瓷食盆
              </p>
              <p className="mt-1 text-[10px] leading-4 text-ink/45">
                绞胎彩纹 · 五色陶土
                <br />
                口径 18cm × 高 8cm
              </p>
            </div>

            <span className="absolute -right-1 top-1 grid h-12 w-12 place-items-center border border-clay/30 bg-clay font-display text-lg text-paper">
              陶
            </span>
          </Reveal>
        </div>
      </section>

      {/* 在窑展廊 */}
      <section
        ref={marqueeRef}
        className="marquee-shell overflow-hidden border-y border-line py-6"
        style={{
          maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <div className="container-page mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <span className="eyebrow">IN THE KILN</span>
          <span className="text-[11px] text-ink/45">35 件在窑 · 每一件都只有一只</span>
        </div>
        <div className="flex w-max animate-marquee">
          <TickerRow />
          <TickerRow hidden />
        </div>
      </section>

      {/* 五类器物 */}
      <section id="categories" className="container-page scroll-mt-24 section-y">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <div className="flex items-baseline gap-3">
                <span className="exhibit-no">01</span>
                <span className="eyebrow">FIVE KINDS</span>
              </div>
              <h2 className="mt-4 text-section text-ink">五种器物，五段日常</h2>
              <p className="mt-4 text-sm leading-7 text-ink/60">
                从清晨的食盆到案头的摆件，器物跟着它一起，把日子过成具体的形状。
              </p>
            </div>
            <Link to={primaryHref} state={signedIn ? undefined : authState} className="link-arrow">
              查看全部 35 件
              <IconArrowRight />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-5">
          {CATEGORIES.map((item, index) => (
            <Reveal key={item.sku} delay={index * 60}>
              <Link
                to={primaryHref}
                state={signedIn ? undefined : authState}
                className="group block"
              >
                <div className="object-stage overflow-hidden">
                  <div className="aspect-[3/4] w-full overflow-hidden">
                    <ProductImage
                      sku={item.sku}
                      alt={item.name}
                      sizes="(min-width: 1024px) 18vw, 44vw"
                      className="transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-2.5">
                  <p className="font-mono text-micro tracking-[0.2em] text-clay/60">
                    {String(index + 1).padStart(2, '0')} · {item.en}
                  </p>
                  <p className="mt-2 font-display text-base text-ink transition group-hover:text-clay">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-ink/45">{item.desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 宣言 */}
      <section className="grain bg-ink text-paper">
        <div className="container-page grid items-center gap-12 py-section-sm lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-balance text-section leading-[1.25] text-paper">
              「它不是一只碗，
              <br />
              是它每天等你回家的理由。」
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-paper/15 pt-8">
              {STATS.map((item) => (
                <div key={item.label}>
                  <p className="font-display text-xl text-gold sm:text-2xl">{item.value}</p>
                  <p className="mt-2 text-[10px] leading-4 text-paper/45 sm:text-[11px]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="object-stage overflow-hidden">
              <div className="aspect-[5/4] w-full">
                <ProductImage
                  sku="ZG-JN-01"
                  alt="窑变星河宠物纪念罐，烛光旁"
                  sizes="(min-width: 1024px) 34vw, 92vw"
                />
              </div>
            </div>
            <p className="mt-3 text-micro tracking-[0.2em] text-paper/40">
              窑变星河 · 可刻名字与日期
            </p>
          </div>
        </div>
      </section>

      {/* 三个时刻 */}
      <section id="moments" className="container-page scroll-mt-24 section-y">
        <Reveal>
          <div className="max-w-2xl">
            <div className="flex items-baseline gap-3">
              <span className="exhibit-no">02</span>
              <span className="eyebrow">A DAY WITH IT</span>
            </div>
            <h2 className="mt-4 text-section text-ink">一天里的三个时刻</h2>
            <p className="mt-4 text-sm leading-7 text-ink/60">
              器物真正的价值，不在展柜里，而在它每天等你回家的时候。
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-3">
          {MOMENTS.map((moment, index) => (
            <Reveal key={moment.sku} delay={index * 80} className={moment.offset}>
              <article className="group">
                <div className="relative object-stage overflow-hidden">
                  <div className="aspect-[4/5] w-full overflow-hidden">
                    <ProductImage
                      sku={moment.sku}
                      alt={moment.alt}
                      sizes="(min-width: 768px) 30vw, 92vw"
                      className="transition-transform duration-700 ease-silk group-hover:scale-[1.03]"
                    />
                  </div>
                  <span className="absolute left-4 top-4 font-mono text-sm tracking-[0.14em] text-ink/70">
                    {moment.time}
                  </span>
                </div>
                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-[10px] tracking-[0.22em] text-clay/70">{moment.title}</p>
                  <p className="mt-2 font-display text-sm leading-6 text-ink/75">{moment.caption}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 手艺 */}
      <section id="craft" className="scroll-mt-24 border-y border-line bg-sand/40">
        <div className="container-page grid items-center gap-14 py-section-sm lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="relative pb-8">
            <div className="object-stage overflow-hidden">
              <div className="aspect-[4/3] w-full">
                <ProductImage
                  sku="ZG-GP-01"
                  alt="手刻骨朵纹宠物名牌，亚麻布与皮绳"
                  sizes="(min-width: 1024px) 42vw, 92vw"
                />
              </div>
            </div>

            <div className="absolute -bottom-2 right-0 w-[44%] border-4 border-cream shadow-card">
              <div className="aspect-square w-full overflow-hidden">
                <ProductImage sku="ZG-SB-02" alt="云岚五色猫用浅口饭盆" sizes="18vw" />
              </div>
            </div>

            <span className="absolute -top-3 left-5 border border-line bg-cream px-3 py-1 text-micro tracking-[0.16em] text-clay">
              入窑一色 · 出窑万彩
            </span>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex items-baseline gap-3">
              <span className="exhibit-no">03</span>
              <span className="eyebrow">FROM THE KILN</span>
            </div>
            <h2 className="mt-4 text-section text-ink">从柘沟的窑火，到你家的地板</h2>
            <p className="mt-5 max-w-reading text-sm leading-7 text-ink/65">
              柘沟土陶从大汶口文化一路烧到今天。五色陶土不施化学釉，绞胎让纹理长进胎骨，窑变让每一只都不听人的话——所以，每一只都只属于一个它。
            </p>

            <div className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {CRAFTS.map((craft, index) => (
                <div key={craft.title} className="border-t border-line pt-4">
                  <p className="flex items-baseline gap-2.5 font-display text-sm text-ink">
                    <span className="font-mono text-micro tracking-[0.2em] text-clay/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {craft.title}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-ink/50">{craft.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 结尾 CTA */}
      <section className="container-page section-y">
        <Reveal className="grid overflow-hidden border border-line bg-ink text-paper lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-8 py-14 sm:px-14">
            <p className="text-balance font-display text-[2rem] leading-[1.3] text-paper sm:text-[2.5rem]">
              它的一生不长，
              <br />
              值得一只认真做过的碗。
            </p>
            <p className="mt-5 max-w-md text-xs leading-6 text-paper/50 sm:text-sm">
              {signedIn
                ? '继续为它挑选一只柘沟陶器，或回到首页看看今天的新纹样。'
                : canBrowse
                  ? '可直接进入展馆浏览；登录后可保存购物车与订单。'
                  : '注册后即可为它挑选、收藏，并体验 AI 语义搜索。'}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={primaryHref}
                state={signedIn ? undefined : authState}
                className="inline-flex w-full items-center justify-center gap-2 bg-clay px-7 py-3 text-sm font-medium text-paper transition duration-300 ease-silk hover:bg-clay-dark sm:w-auto"
              >
                {primaryLabel}
              </Link>
              {signedIn ? null : (
                <Link
                  to="/login"
                  state={authState}
                  className="inline-flex w-full items-center justify-center border border-paper/25 px-6 py-3 text-sm text-paper/75 transition duration-300 ease-silk hover:border-gold hover:text-gold sm:w-auto"
                >
                  我已有账号
                </Link>
              )}
            </div>
          </div>

          <div className="relative min-h-[240px] lg:min-h-0">
            <div className="absolute inset-0">
              <ProductImage
                sku="ZG-SB-07"
                alt="同纹主人杯与猫用浅口碗"
                sizes="(min-width: 1024px) 40vw, 92vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10 lg:bg-gradient-to-r lg:from-ink lg:via-ink/25 lg:to-transparent" />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
      <AssistantWidget />
    </div>
  )
}
