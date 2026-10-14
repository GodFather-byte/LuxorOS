import { appRegistry, getApp } from '../../apps/registry'
import type { AppId, AppWindow } from '../../kernel/types'

interface Props {
  windows: AppWindow[]
  onLaunch: (appId: AppId) => void
  onRestore: (windowId: string) => void
}

export function Dock({ windows, onLaunch, onRestore }: Props) {
  return (
    <footer className="dock" aria-label="Dock de aplicativos">
      {appRegistry.map((app) => (
        <button key={app.id} className="dock-item" title={app.description} onClick={() => onLaunch(app.id)}>
          <span className="dock-icon">{app.icon}</span>
          <span className="dock-label">{app.name}</span>
        </button>
      ))}
      {windows.length > 0 && <span className="dock-divider" aria-hidden />}
      {windows.map((w) => (
        <button
          key={w.id}
          className={`dock-item running ${w.minimized ? 'minimized' : ''}`}
          title={w.minimized ? `Restaurar ${w.title}` : w.title}
          onClick={() => onRestore(w.id)}
        >
          <span className="dock-icon">{getApp(w.appId).icon}</span>
        </button>
      ))}
    </footer>
  )
}
