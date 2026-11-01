import { Link } from 'react-router-dom'
import { IconArrowRight } from './icons'

/**
 * 版块抬头：展签式眉标 + 大标题 + 说明 + 可选的右侧链接。
 */
export default function SectionHead({
  index,
  eyebrow,
  title,
  description,
  action,
  actionTo,
  className = '',
  align = 'left',
}) {
  return (
    <div
      className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
        {(index || eyebrow) && (
          <div
            className={`flex items-baseline gap-3 ${align === 'center' ? 'justify-center' : ''}`}
          >
            {index ? <span className="exhibit-no">{index}</span> : null}
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          </div>
        )}
        {title ? <h2 className="mt-4 text-section text-ink">{title}</h2> : null}
        {description ? (
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">{description}</p>
        ) : null}
      </div>

      {action && actionTo ? (
        <Link to={actionTo} className="link-arrow shrink-0">
          {action}
          <IconArrowRight />
        </Link>
      ) : null}
    </div>
  )
}
