import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconPaw } from './icons'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function PetLetterModal({ open, order, onClose }) {
  const cardRef = useRef(null)
  const closeRef = useRef(null)
  const previousFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const target = closeRef.current || cardRef.current
      if (target) target.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const nodes = cardRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow

      const target = previousFocusRef.current
      if (target && document.contains(target) && typeof target.focus === 'function') {
        target.focus()
      }
    }
  }, [open])

  if (!open || !order) return null

  const itemNames = (order.items || []).map((item) => item.product_name).filter(Boolean)
  const itemSummary = itemNames.join(' · ')
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm motion-reduce:animate-none"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current()
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pet-letter-title"
        aria-describedby="pet-letter-body"
        tabIndex={-1}
        className="relative my-auto max-h-[86vh] w-full max-w-lg animate-scale-in overflow-y-auto overscroll-contain border border-line bg-cream px-6 py-8 shadow-soft outline-none motion-reduce:animate-none sm:px-9 sm:py-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 0%, rgba(199, 154, 82, 0.10), transparent 42%), radial-gradient(circle at 92% 100%, rgba(184, 92, 56, 0.08), transparent 40%)',
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => onCloseRef.current()}
          aria-label="合上这封信"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-lg leading-none text-ink/35 transition hover:bg-ink/5 hover:text-clay"
        >
          ×
        </button>

        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 rotate-[-6deg] place-items-center rounded-xl border border-clay/25 bg-clay font-display text-2xl text-cream shadow-sm">
            陶
          </span>
          <p className="mt-5 text-[10px] tracking-[0.32em] text-clay/80">一封写给毛孩子的信</p>
          <p className="mt-1 text-[9px] tracking-[0.28em] text-ink/30">
            A LETTER TO MY LITTLE ONE
          </p>
          <h2 id="pet-letter-title" className="mt-4 font-display text-2xl text-ink sm:text-[26px]">
            致我亲爱的毛孩子
          </h2>
          <span className="mx-auto mt-4 block h-px w-16 bg-gold/50" />
        </div>

        <div
          id="pet-letter-body"
          className="mt-5 space-y-3 font-display text-[14px] leading-8 tracking-wide text-ink/70 sm:text-[15px]"
        >
          <p>亲爱的毛孩子：</p>
          <p>今天，家里又多了一件属于你的东西。</p>
          <p>
            它来自泗水柘沟。那里的窑火，已经烧了六千年。匠人把青、红、黄、白、黑五种土揉在一起，拉坯、刻花、入窑，等一场无法复制的窑变。
          </p>
          <p>从今往后，它会记得你每次低头吃饭的样子，也会记得你等我们回家的傍晚。</p>
          <p>愿它盛得下三餐，也盛得下四季。愿你慢一点长大，我们久一点相伴。</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <IconPaw className="h-5 w-5 text-clay/45" />
          <div className="text-right">
            <p className="font-display text-sm text-ink/60">—— 永远爱你的家人</p>
            <p className="mt-1 text-[10px] text-ink/30">{today}</p>
          </div>
        </div>

        <button type="button" onClick={() => onCloseRef.current()} className="btn-primary mt-7 w-full">
          收好这封信
        </button>

        <div className="mt-5 border-t border-ink/8 pt-3 text-center text-[10px] leading-4 text-ink/30">
          <p className="line-clamp-1">
            {itemSummary ? `你为它挑了：${itemSummary}` : '愿这只陶器，陪它好好吃饭'}
          </p>
          {order.order_no ? <p className="mt-0.5">订单 {order.order_no}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
