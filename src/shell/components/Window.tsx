import type { ReactNode } from 'react'
import type { AppWindow } from '../../kernel/types'

interface Props {
  win: AppWindow
  index: number
  onFocus: () => void
  onMinimize: () => void
  onClose: () => void
  children: ReactNode
}

export function Window({ win, index, onFocus, onMinimize, onClose, children }: Props) {
  if (win.minimized) return null
  const offset = (index % 6) * 28
  return (
    <section
      className="window"
      style={{ zIndex: win.zIndex, top: 40 + offset, left: 60 + offset }}
      onMouseDown={onFocus}
      aria-label={win.title}
    >
      <header className="window-titlebar">
        <span>{win.title}</span>
        <div className="window-controls">
          <button aria-label="Minimizar" onClick={onMinimize}>–</button>
          <button aria-label="Fechar" onClick={onClose}>×</button>
        </div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  )
}
