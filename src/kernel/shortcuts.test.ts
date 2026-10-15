import { describe, expect, it } from 'vitest'
import { initialShellState, selectActiveTemple, shellReducer } from './shellReducer'
import { resolveShortcut, type ShortcutKey } from './shortcuts'

const chord = (key: string, modifiers: Partial<ShortcutKey> = {}): ShortcutKey => ({
  key,
  ctrlKey: true,
  metaKey: false,
  shiftKey: true,
  altKey: false,
  ...modifiers,
})

const topWindowId = (state: typeof initialShellState) =>
  selectActiveTemple(state).windows.reduce((a, b) => (b.zIndex > a.zIndex ? b : a)).id

describe('resolveShortcut', () => {
  it('switches to the next and previous Templo, wrapping around', () => {
    expect(resolveShortcut(chord('ArrowRight'), initialShellState)).toEqual({ type: 'temple/activate', templeId: 'temple-2' })
    expect(resolveShortcut(chord('ArrowLeft'), initialShellState)).toEqual({ type: 'temple/activate', templeId: 'temple-2' })
    const last = { ...initialShellState, activeTempleId: 'temple-2' }
    expect(resolveShortcut(chord('ArrowRight'), last)).toEqual({ type: 'temple/activate', templeId: 'temple-1' })
  })

  it('accepts Cmd in place of Ctrl', () => {
    expect(resolveShortcut(chord('ArrowRight', { ctrlKey: false, metaKey: true }), initialShellState))
      .toEqual({ type: 'temple/activate', templeId: 'temple-2' })
  })

  it('does nothing when there is only one Templo', () => {
    const single = { ...initialShellState, temples: [initialShellState.temples[0]] }
    expect(resolveShortcut(chord('ArrowRight'), single)).toBeNull()
  })

  it('moves focus through the windows of the active Templo, wrapping around', () => {
    let state = initialShellState
    for (const appId of ['notes', 'sheets', 'writer'] as const) {
      state = shellReducer(state, { type: 'window/open', appId, title: appId })
    }
    const [first, , last] = selectActiveTemple(state).windows
    expect(topWindowId(state)).toBe(last.id)

    state = shellReducer(state, resolveShortcut(chord('ArrowDown'), state)!)
    expect(topWindowId(state)).toBe(first.id)

    state = shellReducer(state, resolveShortcut(chord('ArrowUp'), state)!)
    expect(topWindowId(state)).toBe(last.id)
  })

  it('restores a minimized window when focus moves to it', () => {
    let state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    state = shellReducer(state, { type: 'window/open', appId: 'sheets', title: 'Tábuas' })
    const [minimized] = selectActiveTemple(state).windows
    state = shellReducer(state, { type: 'window/toggleMinimize', windowId: minimized.id })
    state = shellReducer(state, resolveShortcut(chord('ArrowUp'), state)!)
    expect(selectActiveTemple(state).windows[0].minimized).toBe(false)
  })

  it('has no window to move to when the Templo is empty or holds one window', () => {
    expect(resolveShortcut(chord('ArrowDown'), initialShellState)).toBeNull()
    const one = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    expect(resolveShortcut(chord('ArrowUp'), one)).toBeNull()
  })

  it('ignores keystrokes outside the Ctrl/Cmd+Shift arrow chord', () => {
    expect(resolveShortcut(chord('ArrowRight', { shiftKey: false }), initialShellState)).toBeNull()
    expect(resolveShortcut(chord('ArrowRight', { ctrlKey: false }), initialShellState)).toBeNull()
    expect(resolveShortcut(chord('ArrowRight', { altKey: true }), initialShellState)).toBeNull()
    expect(resolveShortcut(chord('k'), initialShellState)).toBeNull()
    expect(resolveShortcut(chord('Enter'), initialShellState)).toBeNull()
  })
})
