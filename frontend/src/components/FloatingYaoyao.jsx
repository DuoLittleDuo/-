import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatConversation from './chat/ChatConversation'
import { useAgentChat } from './chat/useAgentChat'
import YaoyaoAvatar from './YaoyaoAvatar'
import { IconClose, IconArrowUpRight } from './icons'

/**
 * 悬浮式智能体入口（两级）：
 * L1  桌面宠物形态的 3D 垚垚，常驻右下角，会自己动、会回应情绪
 * L2  点击后原地展开对话面板；面板底部保留宠物，可继续互动
 *      面板顶部另有「独立页」入口，进入 /yaoyao 全屏形态
 */
export default function FloatingYaoyao() {
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState(false)
  const chat = useAgentChat()
  const avatarRef = useRef(null)
  const openedRef = useRef(false)

  // 首次展开时探活
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true
      chat.probe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 开场几秒后提示一次
  useEffect(() => {
    const timer = window.setTimeout(() => setHint(true), 4200)
    const hide = window.setTimeout(() => setHint(false), 11000)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(hide)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handlePet = () => {
    if (!open) {
      setOpen(true)
      setHint(false)
      return
    }
    // 已展开时戳一戳
    avatarRef.current?.play(['jump', 'spin', 'nod', 'shake', 'happy'][Math.floor(Math.random() * 5)])
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[4.5rem] z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5">
      {open ? (
        <section
          role="dialog"
          aria-label="垚垚 · 器物顾问"
          className="pointer-events-auto flex h-[min(70vh,560px)] w-full animate-scale-in flex-col border border-line bg-cream shadow-object motion-reduce:animate-none sm:h-[min(620px,calc(100vh-13rem))] sm:w-[384px]"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden bg-sand/70">
              <img src="/images/yaoyao.jpg" alt="" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm leading-tight text-ink">垚垚</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] tracking-wide text-ink/45">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    chat.online ? 'bg-celadon' : chat.checking ? 'bg-gold' : 'bg-ink/25'
                  }`}
                />
                {chat.online ? chat.model || '在线' : chat.checking ? '正在连接…' : '未连接 · 本地预设'}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={chat.reset}
                className="px-2 py-1 text-[11px] text-ink/45 transition hover:text-clay"
              >
                重置
              </button>
              <Link
                to="/yaoyao"
                aria-label="进入独立页"
                title="进入独立页"
                className="grid h-8 w-8 place-items-center text-ink/45 transition hover:text-clay"
              >
                <IconArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭助手"
                className="grid h-8 w-8 place-items-center text-ink/45 transition hover:text-clay"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          </header>

          <ChatConversation chat={chat} autoFocus />
        </section>
      ) : null}

      <div className="pointer-events-none flex flex-col items-end gap-1.5">
        {!open ? (
          <div
            className={`pointer-events-none relative mb-1 mr-6 hidden select-none transition-all duration-700 ease-silk sm:block ${
              hint ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
            aria-hidden={!hint}
          >
            <span className="block border border-line bg-cream/95 px-3 py-1.5 text-[11px] leading-5 text-ink/65 shadow-card backdrop-blur">
              想问什么？点我聊聊
            </span>
            <span className="absolute -bottom-1 right-7 h-2 w-2 rotate-45 border-b border-r border-line bg-cream/95" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePet}
          aria-label={open ? '戳一下垚垚' : '打开垚垚助手'}
          className="group pointer-events-auto relative h-[160px] w-[124px] shrink-0 transition-transform duration-500 ease-silk hover:-translate-y-1 sm:h-[196px] sm:w-[152px]"
        >
          <YaoyaoAvatar
            mood={chat.mood}
            zoom={0.72}
            delay={600}
            interactive={false}
            apiRef={avatarRef}
            className="h-full w-full"
          />
        </button>

        {!open ? (
          <span className="pointer-events-auto mr-1 flex items-center gap-1.5 border border-line bg-cream/90 px-2 py-1 text-[10px] tracking-wide text-ink/55 shadow-card backdrop-blur">
            <span
              className={`h-1.5 w-1.5 rounded-full ${chat.online ? 'bg-celadon' : 'bg-ink/25'}`}
            />
            问垚垚 · 器物顾问
          </span>
        ) : null}
      </div>
    </div>
  )
}
