import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { moveGeometry, resizeGeometry } from '../../kernel/geometry'
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

export function Window({ win, index, onFocus, onGeometryChange, onMinimize, onClose, children }: Props) {
  const offset = (index % 6) * 28
  const interaction = useRef<Interaction | null>(null)
  const [preview, setPreview] = useState<WindowGeometry | null>(null)
  if (win.minimized) return null
  const geometry = preview ?? win.geometry
  // Clamped against the desktop in CSS too, so a window restored onto a smaller viewport is pulled back on screen.
  const style = {
    zIndex: win.zIndex,
    top: geometry ? `clamp(0px, ${geometry.y}px, calc(100% - ${geometry.height}px))` : 40 + offset,
    left: geometry ? `clamp(0px, ${geometry.x}px, calc(100% - ${geometry.width}px))` : 60 + offset,
    ...(geometry && { width: geometry.width, height: geometry.height }),
  }

  function readGeometry(element: HTMLElement): WindowGeometry {
    // Layout box relative to the desktop. getBoundingClientRect would include the window-in animation's scale and offset.
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
    }
  }

  function beginInteraction(event: PointerEvent<HTMLElement>, type: Interaction['type']) {
    // Skip the minimize/close buttons only: the resize handle is itself a button and must start a resize.
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('.window-controls'))) return
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
    const area = { width: desktop.clientWidth, height: desktop.clientHeight }
    const deltaX = event.clientX - active.startX
    const deltaY = event.clientY - active.startY
    active.geometry = active.type === 'move'
      ? moveGeometry(active.startGeometry, deltaX, deltaY, area)
      : resizeGeometry(active.startGeometry, deltaX, deltaY, area)
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
    const area = { width: desktop.clientWidth, height: desktop.clientHeight }
    onGeometryChange(resizeGeometry(current, increment[0], increment[1], area))
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
