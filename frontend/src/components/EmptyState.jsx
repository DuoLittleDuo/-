import { IconPaw } from './icons'

/**
 * 空状态：大号编号 + 细线区域，不再用 emoji。
 * 兼容旧的 icon 传参（忽略），新代码请用 mark 或默认 00。
 */
export default function EmptyState({ mark = '00', title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center border-y border-line px-6 py-20 text-center">
      <span className="font-mono text-[clamp(3.5rem,8vw,6rem)] leading-none tracking-tight text-ink/12">
        {mark}
      </span>
      <IconPaw className="mt-6 h-5 w-5 text-clay/40" />
      <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-7 text-ink/60">{description}</p>
      ) : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  )
}
