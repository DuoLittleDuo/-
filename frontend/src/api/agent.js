/**
 * 本地智能体（垚垚）接口封装。
 * 走 Vite 的 /agent 代理，同源请求，不需要改后端 CORS。
 */
const AGENT_BASE = '/agent'

export async function checkAgentHealth(timeout = 2500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${AGENT_BASE}/api/health`, { signal: controller.signal })
    if (!res.ok) return { online: false }
    const data = await res.json()
    return { online: true, model: data?.model || '' }
  } catch {
    return { online: false }
  } finally {
    clearTimeout(timer)
  }
}

export async function resetAgentSession(sessionId) {
  if (!sessionId) return
  try {
    await fetch(`${AGENT_BASE}/api/reset?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'POST',
    })
  } catch {
    /* 重置失败不阻塞用户 */
  }
}

/**
 * 流式对话：解析 text/event-stream，逐事件回调。
 * 事件：session / token / emotion / tool / done / error
 */
export async function streamAgentChat({ message, sessionId, signal, onEvent }) {
  const res = await fetch(`${AGENT_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId || undefined }),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      if (!block.trim()) continue

      let event = 'message'
      let data = ''

      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }

      if (!data) continue

      let payload
      try {
        payload = JSON.parse(data)
      } catch {
        continue
      }
      onEvent(event, payload)
    }
  }
}
