import type { AppId, ShellAction, ShellState } from '../kernel/types'
import { getApp } from './registry'
import { STORAGE_KEYS } from './storageKeys'
import { countWords } from './writer/markdown'

/** One saved micro-app document, as listed in the Arquivos panel. */
export interface DocumentSummary {
  appId: AppId
  title: string
  detail: string
}

const MAX_TITLE = 60

function firstLine(text: string): string {
  const line = text.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  return line.length > MAX_TITLE ? `${line.slice(0, MAX_TITLE - 1)}…` : line
}

const words = (text: string) => {
  const count = countWords(text)
  return `${count} ${count === 1 ? 'palavra' : 'palavras'}`
}

function filledCells(raw: string): number {
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return 0
    return Object.values(data).filter((value) => typeof value === 'string' && value.trim() !== '').length
  } catch {
    return 0
  }
}

function pageTitle(url: string): string {
  try {
    const { host, pathname } = new URL(url)
    return firstLine(pathname === '/' ? host : `${host}${pathname}`)
  } catch {
    return firstLine(url)
  }
}

/** Summaries of the documents the micro-apps saved; apps with nothing saved are left out. */
export function listDocuments(storage: Pick<Storage, 'getItem'> | null): DocumentSummary[] {
  const read = (key: string) => {
    try {
      return storage?.getItem(key) ?? ''
    } catch {
      return ''
    }
  }
  const documents: DocumentSummary[] = []

  const notes = read(STORAGE_KEYS.notes)
  if (notes.trim()) documents.push({ appId: 'notes', title: firstLine(notes), detail: words(notes) })

  const writer = read(STORAGE_KEYS.writer)
  if (writer.trim()) {
    documents.push({ appId: 'writer', title: firstLine(writer).replace(/^#{1,6}\s+/, '') || 'Documento', detail: words(writer) })
  }

  const cells = filledCells(read(STORAGE_KEYS.sheets))
  if (cells) {
    documents.push({ appId: 'sheets', title: 'Planilha', detail: `${cells} ${cells === 1 ? 'célula preenchida' : 'células preenchidas'}` })
  }

  const page = read(STORAGE_KEYS.browser)
  if (page.trim()) documents.push({ appId: 'browser', title: pageTitle(page), detail: 'Última página aberta' })

  return documents
}

/** Brings the app's window in the active Templo to the front, or opens one if there is none. */
export function openDocumentAction(state: ShellState, appId: AppId): ShellAction {
  const temple = state.temples.find((t) => t.id === state.activeTempleId) ?? state.temples[0]
  const existing = temple.windows.find((w) => w.appId === appId)
  return existing ? { type: 'window/focus', windowId: existing.id } : { type: 'window/open', appId, title: getApp(appId).name }
}
