import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNT = { username: 'demo', password: 'demo123456' }

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const isRegister = location.pathname === '/register'
  const from = location.state?.from || '/'

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm: '',
    display_name: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.username.trim() || !form.password) {
      setError('请填写用户名和密码')
      return
    }
    if (isRegister && form.password !== form.confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register({
          username: form.username.trim(),
          password: form.password,
          display_name: form.display_name.trim() || null,
        })
      } else {
        await login(form.username.trim(), form.password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        errorMessage(err, isRegister ? '注册失败，请稍后重试' : '登录失败，请检查账号与密码'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = () => {
    setForm((previous) => ({
      ...previous,
      username: DEMO_ACCOUNT.username,
      password: DEMO_ACCOUNT.password,
    }))
    setError('')
  }

  const tabClass = (active) =>
    `flex-1 rounded-full py-2 text-center text-sm transition ${
      active ? 'bg-white text-clay shadow-sm' : 'text-ink/45 hover:text-ink/70'
    }`

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-14 text-cream lg:flex lg:flex-col lg:justify-between">
        <span className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-cream/10 bg-clay/10" />
        <span className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full border border-cream/10 bg-celadon/10" />
        <span className="pointer-events-none absolute right-16 bottom-24 h-28 w-28 rounded-full border border-gold/20" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-clay font-display text-2xl">
              陶
            </span>
            <div>
              <p className="font-display text-xl">柘沟陶宠</p>
              <p className="text-[10px] tracking-[0.3em] text-cream/35">ZHEGOU POTTERY PET</p>
            </div>
          </div>

          <h1 className="mt-20 max-w-md font-display text-4xl leading-snug">
            把六千年柘沟土陶，
            <br />
            <span className="text-gold">盛进它的饭碗</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-cream/55">
            五色陶土、绞胎彩纹、窑变纹理——为宠物手作一只不可复制的食盆，让非遗纹样成为日常的一部分。
          </p>

          <div className="mt-10 grid max-w-sm grid-cols-3 gap-3 text-center">
            {[
              { value: '5', label: '陶器类目' },
              { value: '35', label: '手作商品' },
              { value: 'AI', label: '语义检索' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-cream/10 bg-cream/5 py-4">
                <p className="font-display text-2xl text-gold">{item.value}</p>
                <p className="mt-1 text-[10px] tracking-wide text-cream/40">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-cream/25">泗水柘沟 · 大汶口文化 · 非遗土陶</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-clay font-display text-xl text-cream">
              陶
            </span>
            <div>
              <p className="font-display text-lg text-ink">柘沟陶宠</p>
              <p className="text-[10px] tracking-[0.2em] text-ink/40">非遗土陶 · 宠物文创</p>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white/80 p-6 shadow-soft sm:p-8">
            <div className="flex rounded-full bg-sand/70 p-1">
              <Link to="/login" className={tabClass(!isRegister)}>
                登录
              </Link>
              <Link to="/register" className={tabClass(isRegister)}>
                注册
              </Link>
            </div>

            <h2 className="mt-7 font-display text-2xl text-ink">
              {isRegister ? '创建你的账号' : '欢迎回来'}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-ink/45">
              {isRegister
                ? '注册后即可收藏喜欢的陶器，并体验 AI 语义搜索。'
                : '登录后继续挑选属于它的那只陶碗。'}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs font-medium text-ink/60">
                用户名
                <input
                  value={form.username}
                  onChange={updateField('username')}
                  className="input-base mt-1.5"
                  placeholder="3-30 个字符"
                  autoComplete="username"
                />
              </label>

              {isRegister ? (
                <label className="block text-xs font-medium text-ink/60">
                  昵称（可选）
                  <input
                    value={form.display_name}
                    onChange={updateField('display_name')}
                    className="input-base mt-1.5"
                    placeholder="怎么称呼你"
                    autoComplete="nickname"
                  />
                </label>
              ) : null}

              <label className="block text-xs font-medium text-ink/60">
                密码
                <input
                  type="password"
                  value={form.password}
                  onChange={updateField('password')}
                  className="input-base mt-1.5"
                  placeholder={isRegister ? '至少 6 个字符' : '请输入密码'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </label>

              {isRegister ? (
                <label className="block text-xs font-medium text-ink/60">
                  确认密码
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={updateField('confirm')}
                    className="input-base mt-1.5"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              {error ? (
                <p className="rounded-lg bg-clay/10 px-3 py-2 text-xs leading-5 text-clay">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? '请稍候…' : isRegister ? '注册并进入' : '登录'}
              </button>
            </form>

            {!isRegister ? (
              <button
                type="button"
                onClick={fillDemo}
                className="mt-4 w-full text-center text-xs text-ink/35 transition hover:text-clay"
              >
                填入演示账号：demo / demo123456
              </button>
            ) : null}
          </div>

          <Link
            to="/welcome"
            className="mt-5 flex items-center justify-center gap-1 text-[11px] text-ink/35 transition hover:text-clay"
          >
            ← 回到欢迎页
          </Link>

          <p className="mt-3 text-center text-[11px] leading-5 text-ink/30">
            本站为大学生创新创业项目演示站
            <br />
            商品与价格均为演示数据
          </p>
        </div>
      </main>
    </div>
  )
}
