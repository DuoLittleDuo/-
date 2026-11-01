import { Link } from 'react-router-dom'
import { DEMO_MODE } from '../config/runtime'
import { resetDemoStore } from '../data/demoStore'
import BrandMark from './BrandMark'

export default function SiteFooter() {
  const handleReset = () => {
    resetDemoStore()
    if (typeof window !== 'undefined') window.location.reload()
  }

  return (
    <footer className="border-t border-line bg-sand/35">
      <div className="container-page py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <BrandMark to="/" />
            <p className="mt-4 text-xs leading-6 text-ink/55">
              泗水柘沟 · 大汶口文化 · 非遗土陶
              <br />
              为宠物做一只认真烧过的碗。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-xs text-ink/60 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="eyebrow text-ink/40">浏览</p>
              <Link to="/" className="block hover:text-clay">
                首页
              </Link>
              <Link to="/search" className="block hover:text-clay">
                全部器物
              </Link>
            </div>
            <div className="space-y-3">
              <p className="eyebrow text-ink/40">账户</p>
              <Link to="/favorites" className="block hover:text-clay">
                我的收藏
              </Link>
              <Link to="/orders" className="block hover:text-clay">
                我的订单
              </Link>
            </div>
            <div className="space-y-3">
              <p className="eyebrow text-ink/40">关于</p>
              <Link to="/welcome" className="block hover:text-clay">
                品牌介绍
              </Link>
              {DEMO_MODE ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="block text-left hover:text-clay"
                >
                  重置演示数据
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[11px] text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <p>柘沟陶宠 · 大学生创新创业项目演示站</p>
          <p className="flex items-center gap-3">
            <span>商品与数据均为演示内容，不接入真实支付</span>
            {DEMO_MODE ? (
              <span className="border border-line px-2 py-0.5 text-[10px] tracking-widest text-ink/45">
                DEMO
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  )
}
