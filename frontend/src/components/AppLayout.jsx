import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-ink/10 bg-sand/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            <span className="font-display text-sm text-ink/70">柘沟陶宠</span>
            <span className="ml-2">非遗土陶 × 宠物经济 × AI 语义检索</span>
          </p>
          <p>大创项目演示站 · 商品与数据均为演示内容</p>
        </div>
      </footer>
    </div>
  )
}
