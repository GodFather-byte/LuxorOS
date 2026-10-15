import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { clampBounds, moveBounds, resizeBounds, TITLEBAR_HEIGHT, VISIBLE_GRIP } from '../../kernel/geometry'
import type { AppWindow, WindowBounds } from '../../kernel/types'

interface Props {
  win: AppWindow
  onFocus: () => void
  onMinimize: () => void
  onClose: () => void
  onBoundsChange: (bounds: WindowBounds) => void
  children: ReactNode
}

type Mode = 'move' | 'resize'

interface Gesture {
  mode: Mode
  pointerId: number
  startX: number
  startY: number
  origin: WindowBounds
  latest: WindowBounds
  moved: boolean
}

export function Window({ win, onFocus, onMinimize, onClose, onBoundsChange, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const gesture = useRef<Gesture | null>(null)
  // Live geometry during a gesture stays local; the shell state (and session storage) updates once on release.
  const [draft, setDraft] = useState<WindowBounds | null>(null)
  if (win.minimized) return null
  const bounds = draft ?? win.bounds

  const begin = (mode: Mode) => (event: ReactPointerEvent<HTMLElement>) => {
    const el = ref.current
    if (event.button !== 0 || !el || (event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    // Start from the rendered geometry: the stylesheet can clamp it when the viewport shrank.
    const origin = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }
    gesture.current = { mode, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin, latest: origin, moved: false }
  }

  const track = (event: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointerId) return
    const dx = event.clientX - g.startX
    const dy = event.clientY - g.startY
    g.latest = g.mode === 'move' ? moveBounds(g.origin, dx, dy) : resizeBounds(g.origin, dx, dy)
    g.moved = g.moved || dx !== 0 || dy !== 0
    setDraft(g.latest)
  }

  const end = (commit: boolean) => (event: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointerId) return
    gesture.current = null
    setDraft(null)
    const area = ref.current?.offsetParent
    if (commit && g.moved && area) {
      onBoundsChange(clampBounds(g.latest, { width: area.clientWidth, height: area.clientHeight }))
    }
  }

  const dragProps = (mode: Mode) => ({
    onPointerDown: begin(mode),
    onPointerMove: track,
    onPointerUp: end(true),
    onPointerCancel: end(false),
  })

  return (
    <section
      ref={ref}
      className="window"
      style={{
        zIndex: win.zIndex,
        left: `clamp(${VISIBLE_GRIP - bounds.width}px, ${bounds.x}px, calc(100% - ${VISIBLE_GRIP}px))`,
        top: `clamp(0px, ${bounds.y}px, calc(100% - ${TITLEBAR_HEIGHT}px))`,
        width: bounds.width,
        height: bounds.height,
      }}
      onMouseDown={onFocus}
      aria-label={win.title}
    >
      <header className="window-titlebar" {...dragProps('move')}>
        <span>{win.title}</span>
        <div className="window-controls">
          <button aria-label="Minimizar" onClick={onMinimize}>–</button>
          <button aria-label="Fechar" onClick={onClose}>×</button>
        </div>
      </header>
      <div className="window-body">{children}</div>
      <div className="window-resize" aria-hidden {...dragProps('resize')} />
    </section>
  )
}
