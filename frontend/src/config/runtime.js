/**
 * 运行时配置。演示模式通过 `npm run dev:demo`（--mode demo）开启，
 * 普通 `npm run dev` / `npm run build` 完全不受影响。
 */
export const TOKEN_KEY = 'zgtc_token'
export const USER_KEY = 'zgtc_user'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const parsedTimeout = Number(import.meta.env.VITE_API_TIMEOUT)
export const API_TIMEOUT = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 20000
