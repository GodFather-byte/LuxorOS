import type { AppManifest } from './registry'

export function PlaceholderApp({ app }: { app: AppManifest }) {
  return (
    <div className="placeholder-app">
      <span className="placeholder-icon">{app.icon}</span>
      <p>{app.name} — {app.description}</p>
      <small>Em construção (ver roadmap).</small>
    </div>
  )
}
