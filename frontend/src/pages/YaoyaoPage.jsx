import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import ChatConversation from '../components/chat/ChatConversation'
import { useAgentChat } from '../components/chat/useAgentChat'
import YaoyaoAvatar from '../components/YaoyaoAvatar'
import { IconArrowLeft } from '../components/icons'

const MOOD_LABEL = {
  happy: '心情不错',
  sad: '有点低落',
  angry: '生气中',
  surprised: '有点惊讶',
  shy: '害羞',
  thinking: '正在想',
  neutral: '安静待着',
}

export default function YaoyaoPage() {
  const chat = useAgentChat()
  const [ready, setReady] = useState(false)

  return (
    <div className="page-canvas min-h-screen">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <BrandMark to="/" />
            <span className="hidden text-micro tracking-[0.24em] text-ink/40 sm:inline">
              器 物 顾 问
            </span>
          </div>

          <Link to="/" className="link-arrow text-xs">
            <IconArrowLeft className="h-3.5 w-3.5" />
            回到商城
          </Link>
        </div>
      </header>

      <main className="container-page grid gap-8 py-8 lg:h-[calc(100vh-4rem)] lg:grid-cols-[1fr_460px] lg:gap-12 lg:py-10">
        {/* 3D 舞台 */}
        <section className="relative flex flex-col">
          <div className="relative flex-1 border border-line bg-[radial-gradient(120%_100%_at_50%_0%,#FFFCF6_0%,#F7EFE4_58%,#EFE3D2_100%)]">
            <YaoyaoAvatar
              mood={chat.mood}
              controls
              interactive
              onReady={() => setReady(true)}
              className="h-[46vh] w-full lg:h-full"
            />

            <div className="pointer-events-none absolute left-5 top-5">
              <p className="exhibit-no">YAOYAO · 001</p>
              <p className="mt-2 font-display text-lg text-ink">垚垚</p>
              <p className="mt-1 text-[11px] text-ink/45">
                {ready ? '拖动可以转动她 · 戳一下会有反应' : '正在把她请出来…'}
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 border border-line bg-cream/85 px-3 py-1.5 text-[11px] text-ink/55 backdrop-blur">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  chat.online ? 'bg-celadon' : chat.checking ? 'bg-gold' : 'bg-ink/25'
                }`}
              />
              {chat.online ? `在线 · ${chat.model || '本地智能体'}` : chat.checking ? '连接中…' : '未连接 · 本地预设'}
              <span className="mx-1 text-ink/20">|</span>
              {MOOD_LABEL[chat.mood] || MOOD_LABEL.neutral}
            </div>
          </div>
        </section>

        {/* 对话 */}
        <section className="flex min-h-[60vh] flex-col border border-line bg-cream lg:min-h-0">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <img src="/images/yaoyao.jpg" alt="" className="h-9 w-9 object-cover" />
            <div className="min-w-0">
              <p className="font-display text-sm leading-tight text-ink">和垚垚聊天</p>
              <p className="mt-0.5 text-[10px] tracking-wide text-ink/45">
                器物尺寸 · 养护 · 手艺，随便问
              </p>
            </div>
            <button
              type="button"
              onClick={chat.reset}
              className="ml-auto px-2 py-1 text-[11px] text-ink/45 transition hover:text-clay"
            >
              重置记忆
            </button>
          </header>

          <ChatConversation chat={chat} variant="page" autoFocus />
        </section>
      </main>
    </div>
  )
}
