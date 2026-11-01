import { useEffect, useRef, useState } from 'react'
import { IconArrowUpRight, IconPlus } from '../icons'
import { GREETING, PRESETS } from './useAgentChat'

export default function ChatConversation({
  chat,
  variant = 'panel',
  autoFocus = false,
  className = '',
}) {
  const { messages, sending, activity, online, checking, send, probe } = chat
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const wide = variant === 'page'

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages])

  useEffect(() => {
    // 移动端不自动聚焦，避免弹出键盘把内容顶走
    const canAutoFocus =
      autoFocus && window.matchMedia && window.matchMedia('(min-width: 640px)').matches
    if (!canAutoFocus) return undefined
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150)
    return () => window.clearTimeout(timer)
  }, [autoFocus])

  const submit = (value) => {
    const text = (value ?? input).trim()
    if (!text || sending) return
    setInput('')
    send(text)
    inputRef.current?.focus()
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
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
            <p className={`text-ink/70 ${wide ? 'text-base leading-8' : 'text-sm leading-7'}`}>
              {GREETING}
            </p>
            <div className={`mt-4 grid gap-2 ${wide ? 'sm:grid-cols-2' : ''}`}>
              {PRESETS.map((item) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => submit(item.q)}
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
                  ? `max-w-[85%] bg-clay px-3.5 py-2.5 text-paper ${wide ? 'text-[15px] leading-7' : 'text-sm leading-6'}`
                  : `max-w-[88%] border border-line bg-paper px-3.5 py-2.5 text-ink/80 ${wide ? 'text-[15px] leading-7' : 'text-sm leading-6'}`
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

        {activity ? <p className="text-[10px] tracking-wide text-ink/35">{activity}</p> : null}
      </div>

      <div className="border-t border-line px-3 py-3 sm:px-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder="说点什么…（Enter 发送）"
            aria-label="给垚垚发消息"
            className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={sending || !input.trim()}
            aria-label="发送"
            className="grid h-10 w-10 shrink-0 place-items-center bg-clay text-paper transition duration-300 ease-silk hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
