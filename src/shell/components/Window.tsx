import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import type { AppWindow, WindowGeometry } from '../../kernel/types'

interface Props {
  win: AppWindow
  index: number
  onFocus: () => void
  onGeometryChange: (geometry: WindowGeometry) => void
  onMinimize: () => void
  onClose: () => void
  children: ReactNode
}

type Interaction = {
  type: 'move' | 'resize'
  pointerId: number
  startX: number
  startY: number
  startGeometry: WindowGeometry
  geometry: WindowGeometry
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function Window({ win, index, onFocus, onGeometryChange, onMinimize, onClose, children }: Props) {
  const offset = (index % 6) * 28
  const interaction = useRef<Interaction | null>(null)
  const [preview, setPreview] = useState<WindowGeometry | null>(null)
  if (win.minimized) return null
  const geometry = preview ?? win.geometry
  const style = {
    zIndex: win.zIndex,
    top: geometry?.y ?? 40 + offset,
    left: geometry?.x ?? 60 + offset,
    ...(geometry && { width: geometry.width, height: geometry.height }),
  }

  function readGeometry(element: HTMLElement): WindowGeometry {
    const desktop = element.parentElement
    const rect = element.getBoundingClientRect()
    const bounds = desktop?.getBoundingClientRect()
    return {
      x: bounds ? rect.left - bounds.left : 0,
      y: bounds ? rect.top - bounds.top : 0,
      width: rect.width,
      height: rect.height,
    }
  }

  function beginInteraction(event: PointerEvent<HTMLElement>, type: Interaction['type']) {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return
    event.preventDefault()
    event.stopPropagation()
    const winElement = event.currentTarget.closest('.window')
    if (!(winElement instanceof HTMLElement)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const geometry = readGeometry(winElement)
    interaction.current = {
      type,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startGeometry: geometry,
      geometry,
    }
  }

  function updateInteraction(event: PointerEvent<HTMLElement>) {
    const active = interaction.current
    if (!active || active.pointerId !== event.pointerId) return
    const winElement = event.currentTarget.closest('.window')
    const desktop = winElement?.parentElement
    if (!winElement || !desktop) return
    const width = desktop.clientWidth
    const height = desktop.clientHeight
    const deltaX = event.clientX - active.startX
    const deltaY = event.clientY - active.startY
    if (active.type === 'move') {
      active.geometry = {
        ...active.startGeometry,
        x: clamp(active.startGeometry.x + deltaX, 0, width - active.startGeometry.width),
        y: clamp(active.startGeometry.y + deltaY, 0, height - active.startGeometry.height),
      }
    } else {
      const maxWidth = Math.max(1, width - active.startGeometry.x)
      const maxHeight = Math.max(1, height - active.startGeometry.y)
      active.geometry = {
        ...active.startGeometry,
        width: clamp(active.startGeometry.width + deltaX, Math.min(240, maxWidth), maxWidth),
        height: clamp(active.startGeometry.height + deltaY, Math.min(160, maxHeight), maxHeight),
      }
    }
    setPreview({ ...active.geometry })
  }

  function finishInteraction(event: PointerEvent<HTMLElement>) {
    const active = interaction.current
    if (!active || active.pointerId !== event.pointerId) return
    interaction.current = null
    setPreview(null)
    onGeometryChange(active.geometry)
  }

  function resizeWithKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const increments: Record<string, [number, number]> = {
      ArrowUp: [0, -16],
      ArrowDown: [0, 16],
      ArrowLeft: [-16, 0],
      ArrowRight: [16, 0],
    }
    const increment = increments[event.key]
    if (!increment) return
    event.preventDefault()
    const winElement = event.currentTarget.closest('.window')
    if (!(winElement instanceof HTMLElement)) return
    const current = readGeometry(winElement)
    const desktop = winElement.parentElement
    if (!desktop) return
    const maxWidth = Math.max(1, desktop.clientWidth - current.x)
    const maxHeight = Math.max(1, desktop.clientHeight - current.y)
    onGeometryChange({
      ...current,
      width: clamp(current.width + increment[0], Math.min(240, maxWidth), maxWidth),
      height: clamp(current.height + increment[1], Math.min(160, maxHeight), maxHeight),
    })
  }

  return (
    <section
      className="window"
      style={style}
      onMouseDown={onFocus}
      aria-label={win.title}
    >
      <header
        className="window-titlebar"
        onPointerDown={(event) => beginInteraction(event, 'move')}
        onPointerMove={updateInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
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
        type="button"
        aria-label="Redimensionar janela"
        title="Use as setas do teclado para redimensionar"
        onPointerDown={(event) => beginInteraction(event, 'resize')}
        onPointerMove={updateInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onKeyDown={resizeWithKeyboard}
      >⤢</button>
    </section>
  )
}
