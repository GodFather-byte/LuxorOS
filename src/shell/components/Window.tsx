import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import type { AppWindow } from '../../kernel/types'

interface Props {
  win: AppWindow
  onFocus: () => void
  onMinimize: () => void
  onClose: () => void
  onGeometryChange: (geometry: Pick<AppWindow, 'x' | 'y' | 'width' | 'height'>) => void
  children: ReactNode
}

type Geometry = Pick<AppWindow, 'x' | 'y' | 'width' | 'height'>

interface Gesture {
  pointerId: number
  mode: 'move' | 'resize'
  startX: number
  startY: number
  geometry: Geometry
}

export function Window({ win, onFocus, onMinimize, onClose, onGeometryChange, children }: Props) {
  const [previewGeometry, setPreviewGeometry] = useState<Geometry | null>(null)
  const geometry = previewGeometry ?? { x: win.x, y: win.y, width: win.width, height: win.height }
  const gesture = useRef<Gesture | null>(null)

  if (win.minimized) return null

  const startGesture = (event: PointerEvent<HTMLElement>, mode: Gesture['mode']) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    onFocus()
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      geometry,
    }
  }

  const updateGesture = (event: PointerEvent<HTMLElement>) => {
    const active = gesture.current
    if (!active || event.pointerId !== active.pointerId) return
    const desktop = event.currentTarget.parentElement
    if (!desktop) return
    const maxWidth = Math.max(1, desktop.clientWidth - active.geometry.x)
    const maxHeight = Math.max(1, desktop.clientHeight - active.geometry.y)
    const deltaX = event.clientX - active.startX
    const deltaY = event.clientY - active.startY
    if (active.mode === 'move') {
      setPreviewGeometry({
        ...active.geometry,
        x: Math.max(0, Math.min(active.geometry.x + deltaX, desktop.clientWidth - active.geometry.width)),
        y: Math.max(0, Math.min(active.geometry.y + deltaY, desktop.clientHeight - active.geometry.height)),
      })
    } else {
      setPreviewGeometry({
        ...active.geometry,
        width: Math.max(Math.min(200, maxWidth), Math.min(active.geometry.width + deltaX, maxWidth)),
        height: Math.max(Math.min(140, maxHeight), Math.min(active.geometry.height + deltaY, maxHeight)),
      })
    }
  }

  const finishGesture = (event: PointerEvent<HTMLElement>) => {
    if (!gesture.current || event.pointerId !== gesture.current.pointerId) return
    gesture.current = null
    onGeometryChange(geometry)
    setPreviewGeometry(null)
  }

  const resizeByKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const amount = event.shiftKey ? 48 : 16
    const desktop = event.currentTarget.closest('.desktop')
    if (!desktop) return
    let next = geometry
    if (event.key === 'ArrowRight') next = { ...geometry, width: Math.min(desktop.clientWidth - geometry.x, geometry.width + amount) }
    else if (event.key === 'ArrowLeft') next = { ...geometry, width: Math.max(200, geometry.width - amount) }
    else if (event.key === 'ArrowDown') next = { ...geometry, height: Math.min(desktop.clientHeight - geometry.y, geometry.height + amount) }
    else if (event.key === 'ArrowUp') next = { ...geometry, height: Math.max(140, geometry.height - amount) }
    else return
    event.preventDefault()
    onGeometryChange(next)
  }

  return (
    <section
      className="window"
      style={{ zIndex: win.zIndex, top: geometry.y, left: geometry.x, width: geometry.width, height: geometry.height }}
      onMouseDown={onFocus}
      onPointerMove={updateGesture}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      aria-label={win.title}
    >
      <header
        className="window-titlebar"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          startGesture(event, 'move')
        }}
      >
        <span>{win.title}</span>
        <div className="window-controls">
          <button aria-label="Minimizar" onClick={onMinimize}>–</button>
          <button aria-label="Fechar" onClick={onClose}>×</button>
        </div>
      </header>
      <div className="window-body">{children}</div>
      <button
        className="window-resize-handle"
        aria-label={`Redimensionar ${win.title}`}
        title="Arraste para redimensionar; use as setas do teclado"
        onPointerDown={(event) => startGesture(event, 'resize')}
        onKeyDown={resizeByKeyboard}
      />
    </section>
  )
}
