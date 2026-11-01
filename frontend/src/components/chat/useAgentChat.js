import { useCallback, useEffect, useRef, useState } from 'react'
import { checkAgentHealth, resetAgentSession, streamAgentChat } from '../../api/agent'

const SESSION_KEY = 'zgtc_yaoyao_session'

export const PRESETS = [
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

export const GREETING = '嗨，我是垚垚。可以问我器物的尺寸怎么挑、怎么养，或者随便聊聊。'

let seq = 0
const nextId = () => `m${(seq += 1)}`

export function useAgentChat() {
  const [status, setStatus] = useState('idle') // idle | checking | online | offline
  const [model, setModel] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [activity, setActivity] = useState('')
  const [mood, setMood] = useState('neutral')

  const sessionRef = useRef(
    typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null,
  )
  const abortRef = useRef(null)

  const probe = useCallback(async () => {
    setStatus('checking')
    const result = await checkAgentHealth()
    setStatus(result.online ? 'online' : 'offline')
    setModel(result.model || '')
    return result.online
  }, [])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // 进入页面时探一次活，让状态灯准确（本地请求，开销很小）
  useEffect(() => {
    probe()
  }, [probe])

  const reset = useCallback(async () => {
    await resetAgentSession(sessionRef.current)
    sessionRef.current = null
    localStorage.removeItem(SESSION_KEY)
    setMessages([])
    setActivity('')
    setMood('neutral')
  }, [])

  const send = useCallback(
    async (raw) => {
      const text = String(raw || '').trim()
      if (!text || sending) return

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text },
        { id: nextId(), role: 'assistant', text: '', streaming: true },
      ])
      setSending(true)
      setActivity('')
      setMood('thinking')

      const finish = (value) => {
        setMessages((prev) =>
          prev.map((message, index) =>
            index === prev.length - 1 && message.role === 'assistant'
              ? { ...message, text: value, streaming: false }
              : message,
          ),
        )
      }

      if (status !== 'online') {
        const preset = PRESETS.find((item) => item.q === text)
        window.setTimeout(() => {
          finish(
            preset
              ? preset.a
              : '本地智能体还没启动，我先没法认真回答。你可以点上面几条常见问题，或者启动垚垚之后再问我一次。',
          )
          setSending(false)
          setMood(preset ? 'happy' : 'sad')
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
                prev.map((message, index) =>
                  index === prev.length - 1
                    ? { ...message, text: buffer, streaming: true }
                    : message,
                ),
              )
            } else if (event === 'tool') {
              setActivity(`正在调用 ${payload.name}`)
              setMood('thinking')
            } else if (event === 'emotion') {
              setMood(payload.mood || 'neutral')
            } else if (event === 'done') {
              buffer = payload.text || buffer
              finish(buffer)
              setMood(payload.mood || 'happy')
              setActivity('')
            } else if (event === 'error') {
              finish(`出错了：${payload.message}`)
              setMood('sad')
              setActivity('')
            }
          },
        })
        if (!buffer) {
          finish('')
          setMood('neutral')
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setStatus('offline')
          setMood('sad')
          finish('连接断了，可能是本地智能体被关掉了。再点一次发送可以重试。')
        }
      } finally {
        setSending(false)
        abortRef.current = null
      }
    },
    [sending, status],
  )

  return {
    status,
    model,
    online: status === 'online',
    checking: status === 'checking',
    messages,
    sending,
    activity,
    mood,
    probe,
    send,
    reset,
  }
}
