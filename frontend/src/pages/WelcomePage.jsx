import { Link, useLocation } from 'react-router-dom'
import WelcomeImage from '../components/WelcomeImage'
import { useAuth } from '../context/AuthContext'

const SEASONS = [
  {
    src: '/images/welcome/season-spring-cat.jpg',
    emoji: '🐈',
    label: '春 · 晨食',
    title: '春 · 晨食',
    caption: '清晨的第一口，是一天里最安稳的开场。',
    alt: '清晨，猫咪在柘沟陶碗边吃早餐',
    ratio: 'aspect-[4/3]',
    offset: '',
  },
  {
    src: '/images/welcome/season-summer-dog.jpg',
    emoji: '🐕',
    label: '夏 · 饮水',
    title: '夏 · 饮水',
    caption: '暑气正盛，清水要凉一点，碗要稳一点。',
    alt: '夏日，狗狗在陶碗边喝水',
    ratio: 'aspect-[4/3]',
    offset: 'md:mt-10',
  },
  {
    src: '/images/welcome/season-autumn-cat.jpg',
    emoji: '🐈',
    label: '秋冬 · 守候',
    title: '秋冬 · 守候',
    caption: '天冷了，它把下巴搁在碗边，等你回家。',
    alt: '秋冬，猫咪趴在陶碗旁等待',
    ratio: 'aspect-[4/3]',
    offset: '',
  },
]

const CRAFTS = [
  { title: '五色陶土', desc: '青、红、黄、白、黑，天然成色' },
  { title: '绞胎成纹', desc: '两色陶土反复揉叠，纹理入胎，一器一面' },
  { title: '窑变无双', desc: '入窑一色，出窑万彩，无法复制' },
  { title: '手工刻花', desc: '柘沟旧纹，被一刀一刀刻进器身' },
]

function revealStyle(delay) {
  return { animationDelay: `${delay}ms` }
}

export default function WelcomePage() {
  const location = useLocation()
  const { token, booting } = useAuth()

  const signedIn = Boolean(token) && !booting
  const from = location.state?.from || '/'
  const authState = { from }
  const primaryHref = signedIn ? '/' : '/register'

  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to={signedIn ? '/' : '/welcome'} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-clay font-display text-xl text-cream shadow-sm">
            陶
          </span>
          <span>
            <span className="block font-display text-lg leading-tight text-ink">柘沟陶宠</span>
            <span className="block text-[9px] tracking-[0.22em] text-ink/40">
              ZHEGOU POTTERY PET
            </span>
          </span>
        </Link>

        {signedIn ? (
          <Link to="/" className="text-xs text-clay transition hover:text-clay-dark">
            进入首页 →
          </Link>
        ) : (
          <Link
            to="/login"
            state={authState}
            className="rounded-full border border-ink/15 px-4 py-1.5 text-xs text-ink/55 transition hover:border-clay hover:text-clay"
          >
            登录
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <span className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full border border-clay/10 bg-clay/[0.03]" />
        <span className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full border border-celadon/15" />

        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-10">
          <div className="max-w-xl">
            <span
              className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-clay/20 bg-white/60 px-3 py-1 text-[11px] tracking-wide text-clay motion-reduce:animate-none"
              style={revealStyle(0)}
            >
              泗水柘沟 · 六千年窑火
            </span>

            <h1
              className="mt-6 animate-fade-up font-display text-[2.15rem] leading-[1.35] text-ink motion-reduce:animate-none sm:text-5xl sm:leading-[1.3]"
              style={revealStyle(80)}
            >
              六千年历史的陶土，
              <br />
              陪伴毛孩子的
              <span className="text-clay">三餐四季</span>
            </h1>

            <p
              className="mt-6 max-w-lg animate-fade-up text-sm leading-7 text-ink/55 motion-reduce:animate-none sm:text-[15px]"
              style={revealStyle(160)}
            >
              在泗水柘沟，窑火烧了六千年。我们把青、红、黄、白、黑五种陶土，揉进一只碗、一只罐、一方窝边的器皿——让古老的手艺，参与它每一次低头与抬头。
            </p>

            <div
              className="mt-8 flex animate-fade-up flex-col gap-3 motion-reduce:animate-none sm:flex-row sm:items-center"
              style={revealStyle(240)}
            >
              <Link to={primaryHref} state={signedIn ? undefined : authState} className="btn-primary">
                {signedIn ? '继续为它挑选' : '注册，开始挑选'}
              </Link>
              {signedIn ? null : (
                <Link to="/login" state={authState} className="btn-ghost">
                  已有账号，登录
                </Link>
              )}
            </div>

            <p
              className="mt-5 animate-fade-up text-[11px] leading-5 text-ink/30 motion-reduce:animate-none"
              style={revealStyle(320)}
            >
              免费注册 · 大学生创新创业项目演示站 · 不接入真实支付
            </p>
          </div>

          {/* 图片拼贴 */}
          <div
            className="relative mx-auto w-full max-w-md animate-fade-up pb-14 motion-reduce:animate-none lg:max-w-none lg:pb-8"
            style={revealStyle(180)}
          >
            <span className="pointer-events-none absolute -right-4 top-8 hidden h-40 w-40 rotate-12 rounded-full border border-gold/20 sm:block" />

            <div className="relative ml-auto w-[82%]">
              <WelcomeImage
                src="/images/welcome/hero-cat.jpg"
                alt="猫咪在柘沟陶碗前低头进食"
                emoji="🐈"
                label="窑火与它"
                ratio="aspect-[4/5]"
                priority
                className="rounded-t-[999px] rounded-b-[28px] border border-ink/10 shadow-soft"
              />
            </div>

            <div className="absolute -bottom-1 left-0 w-[46%] rotate-[-4deg] sm:-left-2 lg:-left-6">
              <WelcomeImage
                src="/images/welcome/hero-dog.jpg"
                alt="狗狗守着它的陶制食盆"
                emoji="🐕"
                label="三餐四季"
                ratio="aspect-[3/4]"
                className="rounded-2xl border-4 border-cream shadow-card"
              />
            </div>

            <span className="absolute -right-1 top-2 grid h-14 w-14 rotate-[8deg] place-items-center rounded-xl border border-clay/30 bg-clay font-display text-xl text-cream shadow-card sm:right-2 sm:top-4">
              陶
            </span>

            <div className="absolute bottom-16 right-0 hidden max-w-[190px] rounded-xl border border-ink/10 bg-cream/90 px-4 py-3 shadow-card backdrop-blur-sm sm:block">
              <p className="font-display text-xs leading-5 text-ink/65">
                它不懂六千年，
                <br />
                只懂每天这一碗。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="bg-ink">
        <div className="mx-auto max-w-5xl px-5 py-14 text-cream sm:px-8 sm:py-16">
          <p className="font-display text-xl leading-relaxed text-cream/90 sm:text-2xl">
            「它不是一只碗，是它每天等你回家的理由。」
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-cream/10 pt-8">
            {[
              { value: '6000 年', label: '柘沟窑火未断' },
              { value: '5 色', label: '青红黄白黑，天然成土' },
              { value: '1 只', label: '世上没有第二只一样的' },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-xl text-gold sm:text-2xl">{item.value}</p>
                <p className="mt-1.5 text-[10px] leading-4 text-cream/40 sm:text-[11px]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 三餐四季 */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <span className="text-[10px] tracking-[0.3em] text-clay/70">MEALS & SEASONS</span>
          <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">三餐四季，都有它在场</h2>
          <p className="mt-3 text-sm leading-7 text-ink/50">
            器物真正的价值，不在展柜里，而在它每天等你回家的时候。
          </p>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {SEASONS.map((season) => (
            <article key={season.src} className={`group ${season.offset}`}>
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60 p-2 shadow-card transition duration-500 hover:-translate-y-1 hover:border-clay/25 hover:shadow-soft">
                <div className="overflow-hidden rounded-xl">
                  <WelcomeImage
                    src={season.src}
                    alt={season.alt}
                    emoji={season.emoji}
                    label={season.label}
                    ratio={season.ratio}
                    className="transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-3 pb-3 pt-4">
                  <p className="text-[10px] tracking-[0.22em] text-clay/70">{season.title}</p>
                  <p className="mt-2 font-display text-sm leading-6 text-ink/65">{season.caption}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 手艺来源 */}
      <section className="border-y border-ink/5 bg-sand/45">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <WelcomeImage
              src="/images/welcome/craft-hands.jpg"
              alt="匠人双手在拉坯机上制作陶器"
              emoji="🏺"
              label="柘沟窑火"
              ratio="aspect-[3/2]"
              className="rounded-[28px] border border-ink/10 shadow-soft"
            />
            <span className="absolute -bottom-4 -right-3 hidden rounded-full border border-clay/20 bg-cream px-4 py-2 font-display text-xs text-clay shadow-card sm:block">
              入窑一色 · 出窑万彩
            </span>
          </div>

          <div>
            <span className="text-[10px] tracking-[0.3em] text-clay/70">FROM THE KILN</span>
            <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
              从柘沟的窑火，到你家的地板
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/55">
              柘沟土陶从大汶口文化一路烧到今天。五色陶土不施化学釉，绞胎让纹理长进胎骨，窑变让每一只都不听人的话——所以，每一只都只属于一个它。
            </p>

            <div className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {CRAFTS.map((craft) => (
                <div key={craft.title} className="border-t border-ink/10 pt-3">
                  <p className="font-display text-sm text-ink/75">{craft.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink/40">{craft.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 结尾 CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-center text-cream sm:px-12 sm:py-16">
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-cream/10" />
          <span className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-gold/15" />

          <p className="relative font-display text-2xl leading-relaxed sm:text-3xl">
            它的一生不长，
            <br className="sm:hidden" />
            值得一只认真做过的碗。
          </p>
          <p className="relative mx-auto mt-4 max-w-md text-xs leading-6 text-cream/45 sm:text-sm">
            {signedIn
              ? '继续为它挑选一只柘沟陶器，或回到首页看看今天的新纹样。'
              : '注册后即可为它挑选、收藏，并体验 AI 语义搜索。'}
          </p>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              state={signedIn ? undefined : authState}
              className="btn-primary w-full sm:w-auto"
            >
              {signedIn ? '继续为它挑选' : '为它注册'}
            </Link>
            {signedIn ? null : (
              <Link
                to="/login"
                state={authState}
                className="inline-flex w-full items-center justify-center rounded-full border border-cream/25 px-6 py-2.5 text-sm text-cream/75 transition hover:border-gold hover:text-gold sm:w-auto"
              >
                我已有账号
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-7 text-[10px] leading-5 text-ink/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>柘沟陶宠 · 泗水柘沟 · 大汶口文化 · 非遗土陶</p>
          <p>大学生创新创业项目演示站 · 商品与数据均为演示内容</p>
        </div>
      </footer>
    </div>
  )
}
