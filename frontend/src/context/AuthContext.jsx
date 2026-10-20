import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { TOKEN_KEY, USER_KEY } from '../api/client'

const AuthContext = createContext(null)

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readCachedUser)
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const storeSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setBooting(false)
      return undefined
    }

    let active = true
    authApi
      .me()
      .then((profile) => {
        if (!active) return
        localStorage.setItem(USER_KEY, JSON.stringify(profile))
        setUser(profile)
      })
      .catch(() => {
        if (active) logout()
      })
      .finally(() => {
        if (active) setBooting(false)
      })

    return () => {
      active = false
    }
  }, [logout])

  const login = useCallback(
    async (username, password) => {
      const data = await authApi.login({ username, password })
      storeSession(data)
      return data.user
    },
    [storeSession],
  )

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload)
      storeSession(data)
      return data.user
    },
    [storeSession],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, booting, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return context
}
