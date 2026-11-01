import { useCallback, useEffect, useRef, useState } from 'react'
import { checkAgentHealth, resetAgentSession, streamAgentChat } from '../api/agent'
import { IconClose, IconArrowUpRight, IconPlus } from './icons'

const SESSION_KEY = 'zgtc_yaoyao_session'

const PRESETS = [
  {
    q: '怎么挑食盆尺寸？',
    a: '小型犬或猫，口径 12–15cm 就够；中型犬 16–18cm；大型犬建议 20cm 以上。中大型犬选高脚款，低头吃饭不压颈。',
  },
  {
    q: '陶碗怎么清洗养护？',
    a: '温水和软布手洗，别用钢丝球；避免骤冷骤热，刚从冰箱拿出来不要马上倒热水。素陶款洗完晾干再收。',
  },
  {
    q: '绞胎和窑变有什么区别？',
    a: '绞胎是把两色陶土揉叠进胎骨，纹路长在泥里；窑变是釉在窑火里流动，出窑才知道长什么样。前者可以预期，后者每一只都不同。',
  },
  {
    q: '可以刻宠物的名字吗？',
    a: '挂牌和部分纪念罐支持刻名，下单时备注名字即可，制作周期大约 7–10 天。',
  },
]

const GREETING =
  '嗨，我是垚垚。可以问我器物的尺寸怎么挑、怎么养，或者随便聊聊。'

let messageSeq = 0
const nextId = () => `m${++messageSeq}`

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle | checking | online | offline
  const [model, setModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [activity, setActivity] = useState('')

  const sessionRef = useRef(localStorage.getItem(SESSION_KEY) || null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const abortRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, open, scrollToBottom])

  const probe = useCallback(async () => {
    setStatus('checking')
    const result = await checkAgentHealth()
    setStatus(result.online ? 'online' : 'offline')
    setModel(result.model || '')
    return result.online
  }, [])

  const openPanel = useCallback(() => {
    setOpen(true)
    probe()
  }, [probe])

  const closePanel = useCallback(() => {
    setOpen(false)
    if (abortRef.current) abortRef.current.abort()
    launcherRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(timer)
    }
  }, [open, closePanel])

  const appendAssistant = useCallback((text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === 'assistant' && last.streaming) {
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text, streaming: false } : m))
      }
      return [...prev, { id: nextId(), role: 'assistant', text }]
    })
  }, [])

  const send = useCallback(
    async (raw) => {
      const text = (raw ?? input).trim()
      if (!text || sending) return

      setInput('')
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text },
        { id: nextId(), role: 'assistant', text: '', streaming: true },
      ])
      setSending(true)
      setActivity('')

      const finish = (textValue) => {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.role === 'assistant'
              ? { ...m, text: textValue, streaming: false }
              : m,
          ),
        )
      }

      // 未连接时：走本地预设回答，保证演示不中断
      if (status !== 'online') {
        const preset = PRESETS.find((item) => item.q === text)
        window.setTimeout(() => {
          finish(
            preset
              ? preset.a
              : '本地智能体还没启动，我先没法认真回答。你可以点上面几条常见问题，或者启动垚垚之后再问我一次。',
          )
          setSending(false)
        }, 320)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      let buffer = ''

      try {
        await streamAgentChat({
          message: text,
          sessionId: sessionRef.current,
          signal: controller.signal,
          onEvent: (event, payload) => {
            if (event === 'session') {
              sessionRef.current = payload.session_id
              localStorage.setItem(SESSION_KEY, payload.session_id)
            } else if (event === 'token') {
              buffer += payload.text || ''
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, text: buffer, streaming: true } : m,
                ),
              )
            } else if (event === 'tool') {
              setActivity(`正在调用 ${payload.name}`)
            } else if (event === 'emotion') {
              setActivity('')
            } else if (event === 'done') {
              buffer = payload.text || buffer
              finish(buffer)
              setActivity('')
            } else if (event === 'error') {
              finish(`出错了：${payload.message}`)
              setActivity('')
            }
          },
        })
        if (!buffer) finish('')
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setStatus('offline')
          finish('连接断了，可能是本地智能体被关掉了。再点一次发送可以重试。')
        }
      } finally {
        setSending(false)
        abortRef.current = null
        inputRef.current?.focus()
      }
    },
    [input, sending, status],
  )

  const handleReset = async () => {
    await resetAgentSession(sessionRef.current)
    sessionRef.current = null
    localStorage.removeItem(SESSION_KEY)
    setMessages([])
    setActivity('')
    inputRef.current?.focus()
  }

  const online = status === 'online'
  const checking = status === 'checking'

  return (
    <>
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          className="group fixed bottom-20 right-3 z-50 flex items-center gap-3 border border-line bg-cream/95 py-2 pl-2 pr-4 shadow-object backdrop-blur transition duration-300 ease-silk hover:border-clay/50 sm:bottom-5 sm:right-5"
        >
          <img
            src="/images/yaoyao.jpg"
            alt=""
            className="h-10 w-10 object-cover"
          />
          <span className="text-left">
            <span className="block font-display text-sm leading-tight text-ink transition group-hover:text-clay">
              问垚垚
            </span>
            <span className="mt-0.5 block text-[10px] tracking-[0.18em] text-ink/45">
              器物顾问
            </span>
          </span>
        </button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="垚垚 · 器物顾问"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[78vh] max-h-[640px] animate-scale-in flex-col border border-line bg-cream shadow-object motion-reduce:animate-none sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(620px,calc(100vh-6rem))] sm:max-h-none sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <img src="/images/yaoyao.jpg" alt="" className="h-9 w-9 object-cover" />
            <div className="min-w-0">
              <p className="font-display text-sm leading-tight text-ink">垚垚</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] tracking-wide text-ink/45">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    online ? 'bg-celadon' : checking ? 'bg-gold' : 'bg-ink/25'
                  }`}
                />
                {online
                  ? model
                    ? `在线 · ${model}`
                    : '在线'
                  : checking
                    ? '正在连接…'
                    : '未连接 · 本地预设'}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 text-[11px] text-ink/45 transition hover:text-clay"
              >
                重置
              </button>
              <button
                type="button"
                onClick={closePanel}
                aria-label="关闭助手"
                className="grid h-8 w-8 place-items-center text-ink/45 transition hover:text-clay"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {!online && !checking ? (
              <div className="border border-clay/20 bg-clay/5 px-3 py-2.5 text-[11px] leading-5 text-ink/60">
                暂时连不上本地智能体，先用本地预设回答。
                <button
                  type="button"
                  onClick={probe}
                  className="ml-2 border-b border-clay/40 pb-0.5 text-clay transition hover:border-clay"
                >
                  重试连接
                </button>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div>
                <p className="text-sm leading-7 text-ink/70">{GREETING}</p>
                <div className="mt-4 grid gap-2">
                  {PRESETS.map((item) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => send(item.q)}
                      className="group flex items-center justify-between gap-3 border border-line bg-paper/60 px-3 py-2.5 text-left text-xs text-ink/65 transition duration-300 ease-silk hover:border-clay/40 hover:text-clay"
                    >
                      {item.q}
                      <IconPlus className="h-3.5 w-3.5 shrink-0 text-ink/25 transition group-hover:text-clay" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] bg-clay px-3.5 py-2.5 text-sm leading-6 text-paper'
                      : 'max-w-[88%] border border-line bg-paper px-3.5 py-2.5 text-sm leading-6 text-ink/80'
                  }
                >
                  {message.text}
                  {message.streaming && !message.text ? (
                    <span className="inline-flex gap-1" aria-label="正在输入">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/30" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/30 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/30 [animation-delay:300ms]" />
                    </span>
                  ) : null}
                  {message.streaming && message.text ? (
                    <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-ink/40 align-middle" />
                  ) : null}
                </div>
              </div>
            ))}

            {activity ? (
              <p className="text-[10px] tracking-wide text-ink/35">{activity}</p>
            ) : null}
          </div>

          <div className="border-t border-line px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="说点什么…（Enter 发送）"
                aria-label="给垚垚发消息"
                className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={sending || !input.trim()}
                aria-label="发送"
                className="grid h-10 w-10 shrink-0 place-items-center bg-clay text-paper transition duration-300 ease-silk hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-ink/35">
              <span>演示会话 · 由本地智能体提供</span>
              {online ? (
                <a
                  href={`${window.location.protocol}//${window.location.hostname}:8010`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-clay"
                >
                  打开完整形象 ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
