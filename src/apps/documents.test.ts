import { describe, expect, it } from 'vitest'
import { initialShellState, selectActiveTemple, shellReducer } from '../kernel/shellReducer'
import { listDocuments, openDocumentAction } from './documents'
import { STORAGE_KEYS } from './storageKeys'

const storage = (entries: Record<string, string>) => ({ getItem: (key: string) => entries[key] ?? null })

describe('listDocuments', () => {
  it('summarises each saved document and skips apps with nothing saved', () => {
    const documents = listDocuments(storage({
      [STORAGE_KEYS.notes]: '\n  Lista de oferendas  \ntrigo e cevada',
      [STORAGE_KEYS.writer]: '## Crônica de Karnak\n\nTexto.',
      [STORAGE_KEYS.sheets]: JSON.stringify({ A1: '2', A2: '=A1*2', B1: '  ' }),
      [STORAGE_KEYS.browser]: 'https://example.com/a/b?q=1',
    }))
    expect(documents).toEqual([
      { appId: 'notes', title: 'Lista de oferendas', detail: '6 palavras' },
      { appId: 'writer', title: 'Crônica de Karnak', detail: '4 palavras' },
      { appId: 'sheets', title: 'Planilha', detail: '2 células preenchidas' },
      { appId: 'browser', title: 'example.com/a/b', detail: 'Última página aberta' },
    ])
    expect(listDocuments(storage({ [STORAGE_KEYS.notes]: '   ', [STORAGE_KEYS.sheets]: '{}' }))).toEqual([])
  })

  it('shortens long titles and survives corrupt data or blocked storage', () => {
    const [note] = listDocuments(storage({ [STORAGE_KEYS.notes]: 'x'.repeat(100) }))
    expect(note.title).toHaveLength(60)
    expect(note.title.endsWith('…')).toBe(true)
    expect(listDocuments(storage({ [STORAGE_KEYS.sheets]: '{not json', [STORAGE_KEYS.browser]: 'not a url' })))
      .toEqual([{ appId: 'browser', title: 'not a url', detail: 'Última página aberta' }])
    expect(listDocuments({ getItem: () => { throw new Error('blocked') } })).toEqual([])
    expect(listDocuments(null)).toEqual([])
  })
})

describe('openDocumentAction', () => {
  it('focuses an existing window of the app in the active Templo, or opens one', () => {
    expect(openDocumentAction(initialShellState, 'sheets')).toEqual({ type: 'window/open', appId: 'sheets', title: 'Tábuas' })
    const state = shellReducer(initialShellState, { type: 'window/open', appId: 'sheets', title: 'Tábuas' })
    const id = selectActiveTemple(state).windows[0].id
    expect(openDocumentAction(state, 'sheets')).toEqual({ type: 'window/focus', windowId: id })
    const elsewhere = shellReducer(state, { type: 'temple/activate', templeId: 'temple-2' })
    expect(openDocumentAction(elsewhere, 'sheets').type).toBe('window/open')
  })
})
