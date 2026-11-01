/**
 * 演示模式的降级策略：
 * - 只在 VITE_DEMO_MODE=true 时生效，普通开发/构建完全不受影响；
 * - 仅对网络错误、超时、5xx 降级到本地数据；
 * - 401/403/422 等业务错误照常抛出，不掩盖真实问题。
 */
import { DEMO_MODE, TOKEN_KEY } from '../config/runtime'

export { DEMO_MODE }

export function isGuestDemo() {
  if (!DEMO_MODE) return false
  try {
    return !localStorage.getItem(TOKEN_KEY)
  } catch {
    return true
  }
}

function isFallbackWorthy(error) {
  const status = error?.response?.status
  if (typeof status === 'number') return status >= 500
  // 无响应 = 网络错误 / 超时 / 后端未启动
  return true
}

export async function withDemoFallback(request, localFn) {
  if (!DEMO_MODE) return request()

  try {
    return await request()
  } catch (error) {
    if (!isFallbackWorthy(error)) throw error
    return localFn()
  }
}

/** 访客演示态直接走本地，连请求都不发 */
export function localFirst(localFn, request) {
  return isGuestDemo() ? Promise.resolve(localFn()) : request()
}
