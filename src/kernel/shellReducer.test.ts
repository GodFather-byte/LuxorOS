import { describe, expect, it } from 'vitest'
import { initialShellState, selectActiveTemple, shellReducer } from './shellReducer'

describe('shellReducer', () => {
  it('opens a window in the active temple with increasing z-index', () => {
    let s = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    s = shellReducer(s, { type: 'window/open', appId: 'sheets', title: 'Tábuas' })
    const windows = selectActiveTemple(s).windows
    expect(windows).toHaveLength(2)
    expect(windows[1].zIndex).toBeGreaterThan(windows[0].zIndex)
    expect(new Set(windows.map((w) => w.id)).size).toBe(2)
  })

  it('keeps windows isolated per temple', () => {
    let s = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    s = shellReducer(s, { type: 'temple/activate', templeId: 'temple-2' })
    expect(selectActiveTemple(s).windows).toHaveLength(0)
    s = shellReducer(s, { type: 'temple/activate', templeId: 'temple-1' })
    expect(selectActiveTemple(s).windows).toHaveLength(1)
  })

  it('creates and activates a new temple', () => {
    const s = shellReducer(initialShellState, { type: 'temple/create', name: 'Projeto' })
    expect(selectActiveTemple(s).name).toBe('Projeto')
    expect(s.temples).toHaveLength(3)
  })

  it('ignores activation of unknown temples', () => {
    const s = shellReducer(initialShellState, { type: 'temple/activate', templeId: 'nope' })
    expect(s).toBe(initialShellState)
  })

  it('focuses, minimizes and closes windows', () => {
    let s = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const id = selectActiveTemple(s).windows[0].id
    s = shellReducer(s, { type: 'window/toggleMinimize', windowId: id })
    expect(selectActiveTemple(s).windows[0].minimized).toBe(true)
    s = shellReducer(s, { type: 'window/focus', windowId: id })
    expect(selectActiveTemple(s).windows[0].minimized).toBe(false)
    s = shellReducer(s, { type: 'window/close', windowId: id })
    expect(selectActiveTemple(s).windows).toHaveLength(0)
  })

  it('stores window geometry and ignores invalid updates', () => {
    let s = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const id = selectActiveTemple(s).windows[0].id
    s = shellReducer(s, { type: 'window/geometry', windowId: id, x: 120, y: 80, width: 640, height: 420 })
    expect(selectActiveTemple(s).windows[0]).toMatchObject({ x: 120, y: 80, width: 640, height: 420 })
    expect(shellReducer(s, { type: 'window/geometry', windowId: id, x: -1, y: 0, width: 640, height: 420 })).toBe(s)
    expect(shellReducer(s, { type: 'window/geometry', windowId: 'missing', x: 10, y: 10, width: 640, height: 420 })).toEqual(s)
  })

  it('toggles side panels exclusively', () => {
    let s = shellReducer(initialShellState, { type: 'panel/toggle', panel: 'ai' })
    expect(s.openPanel).toBe('ai')
    s = shellReducer(s, { type: 'panel/toggle', panel: 'files' })
    expect(s.openPanel).toBe('files')
    s = shellReducer(s, { type: 'panel/toggle', panel: 'files' })
    expect(s.openPanel).toBeNull()
  })
})
