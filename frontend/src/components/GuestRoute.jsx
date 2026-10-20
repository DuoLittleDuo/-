import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function GuestRoute() {
  const { token, booting } = useAuth()

  if (booting) return <Spinner fullscreen label="正在恢复登录状态" />
  if (token) return <Navigate to="/" replace />

  return <Outlet />
}
