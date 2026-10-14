import type { ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function SidePanel({ open, title, onClose, children }: Props) {
  return (
    <aside className={`side-panel ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={title} inert={!open}>
      <header className="side-panel-header">
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Fechar painel" onClick={onClose}>×</button>
      </header>
      <div className="side-panel-body">{children}</div>
    </aside>
  )
}
