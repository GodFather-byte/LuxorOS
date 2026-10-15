import { listDocuments, openDocumentAction } from '../../apps/documents'
import { getApp } from '../../apps/registry'
import type { ShellAction, ShellState } from '../../kernel/types'

interface Props {
  state: ShellState
  onAction: (action: ShellAction) => void
}

// Reading window.localStorage itself can throw when site data is blocked.
function browserStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function FilesPanel({ state, onAction }: Props) {
  const documents = listDocuments(browserStorage())
  if (!documents.length) {
    return (
      <p className="panel-empty">
        Nenhum documento salvo ainda. Escreva no Papiro, no Escriba ou nas Tábuas, ou abra uma página no Portal.
      </p>
    )
  }
  return (
    <ul className="panel-list files-list" aria-label="Documentos salvos">
      {documents.map((doc) => {
        const app = getApp(doc.appId)
        return (
          <li key={doc.appId}>
            <button type="button" className="file-item" onClick={() => onAction(openDocumentAction(state, doc.appId))}>
              <span className="file-icon" aria-hidden="true">{app.icon}</span>
              <span className="file-text">
                <strong>{doc.title}</strong>
                <small>{app.name} · {doc.detail}</small>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
