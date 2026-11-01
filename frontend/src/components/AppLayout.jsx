import { Outlet } from 'react-router-dom'
import FloatingYaoyao from './FloatingYaoyao'
import Header from './Header'
import SiteFooter from './SiteFooter'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <FloatingYaoyao />
    </div>
  )
}
