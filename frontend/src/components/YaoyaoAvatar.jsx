import { useEffect, useRef, useState } from 'react'
import { createYaoyao } from '../three/yaoyaoScene'

/**
 * 3D 形象容器。按需加载 three + GLB；加载失败时回退到静态头像。
 */
export default function YaoyaoAvatar({
  mood = 'neutral',
  className = '',
  controls = false,
  interactive = true,
  zoom = 1,
  delay = 0,
  onTap,
  onReady,
  apiRef,
  ariaLabel = '垚垚',
}) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const moodRef = useRef(mood)
  const [state, setState] = useState('loading') // loading | ready | error

  useEffect(() => {
    moodRef.current = mood
    sceneRef.current?.play(mood)
  }, [mood])

  useEffect(() => {
    let cancelled = false
    let scene = null
    let timer = null

    const start = () => {
      if (cancelled || !hostRef.current) return
      createYaoyao(hostRef.current, { controls, interactive, zoom, onTap, onReady })
        .then((api) => {
          if (cancelled) {
            api.dispose()
            return
          }
          scene = api
          sceneRef.current = api
          if (apiRef) apiRef.current = api
          api.ready.then(() => {
            if (cancelled) return
            setState('ready')
            api.play(moodRef.current)
          })
        })
        .catch(() => {
          if (!cancelled) setState('error')
        })
    }

    if (delay > 0) timer = window.setTimeout(start, delay)
    else start()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      scene?.dispose()
      sceneRef.current = null
      if (apiRef) apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`relative ${className}`} aria-label={ariaLabel} role="img">
      <div
        ref={hostRef}
        className={`h-full w-full transition-opacity duration-700 ease-silk ${
          state === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {state !== 'ready' ? (
        <div className="absolute inset-0 grid place-items-center">
          {state === 'error' ? (
            <img
              src="/images/yaoyao.jpg"
              alt={ariaLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="yaoyao-pet-shadow" aria-hidden="true" />
          )}
        </div>
      ) : null}
    </div>
  )
}
