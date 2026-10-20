import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute() {
  const { token, booting } = useAuth()
  const location = useLocation()

  if (booting) return <Spinner fullscreen label="正在恢复登录状态" />
  if (!token) {
    return (
      <Navigate
        to="/welcome"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
