import axios from 'axios'

export const TOKEN_KEY = 'zgtc_token'
export const USER_KEY = 'zgtc_user'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error, fallback = '请求失败，请稍后重试') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) return detail[0]?.msg || fallback
  if (error?.code === 'ECONNABORTED') return '请求超时，请稍后重试'
  if (error?.message === 'Network Error') return '无法连接后端服务，请确认 8000 端口已启动'
  return fallback
}

export default api
