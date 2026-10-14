import { useEffect, useState } from 'react'
import type { PanelId, Temple } from '../../kernel/types'

interface Props {
  temples: Temple[]
  activeTempleId: string
  openPanel: PanelId | null
  onActivateTemple: (id: string) => void
  onCreateTemple: () => void
  onTogglePanel: (panel: PanelId) => void
}

const panelButtons: { id: PanelId; label: string; icon: string }[] = [
  { id: 'files', label: 'Arquivos', icon: '🗂' },
  { id: 'tools', label: 'Ferramentas', icon: '⚙' },
  { id: 'ai', label: 'Copiloto', icon: '𓂀' },
]

export function TopBar({ temples, activeTempleId, openPanel, onActivateTemple, onCreateTemple, onTogglePanel }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">△</span> LuxorOS
      </div>
      <nav className="temples" aria-label="Templos de Trabalho">
        {temples.map((t) => (
          <button
            key={t.id}
            className={`temple-tab ${t.id === activeTempleId ? 'active' : ''}`}
            aria-pressed={t.id === activeTempleId}
            onClick={() => onActivateTemple(t.id)}
          >
            <span className="glyph">{t.glyph}</span> {t.name}
            {t.windows.length > 0 && <span className="badge">{t.windows.length}</span>}
          </button>
        ))}
        <button className="temple-tab new" onClick={onCreateTemple} aria-label="Novo Templo">
          +
        </button>
      </nav>
      <div className="topbar-actions">
        {panelButtons.map((p) => (
          <button
            key={p.id}
            className={`icon-btn ${openPanel === p.id ? 'active' : ''}`}
            aria-pressed={openPanel === p.id}
            title={p.label}
            aria-label={p.label}
            onClick={() => onTogglePanel(p.id)}
          >
            {p.icon}
          </button>
        ))}
        <time className="clock">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
      </div>
    </header>
  )
}
