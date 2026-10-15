import { describe, expect, it } from 'vitest'
import { cascadeBounds } from './geometry'
import { initialShellState, selectActiveTemple, shellReducer } from './shellReducer'
import { loadSession, parseSession, saveSession, SESSION_KEY } from './session'

const serialize = (state: unknown) => JSON.stringify({ version: 1, state })

describe('session', () => {
  it('round-trips temples, windows, focus and minimization without reopening panels', () => {
    let state = shellReducer(initialShellState, { type: 'temple/create', name: 'Projeto' })
    state = shellReducer(state, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    state = shellReducer(state, { type: 'window/toggleMinimize', windowId: selectActiveTemple(state).windows[0].id })
    state = shellReducer(state, { type: 'panel/toggle', panel: 'ai' })
    const stored = new Map<string, string>()
    expect(saveSession(state, { setItem: (key, value) => { stored.set(key, value) } })).toBe(true)
    const restored = loadSession({ getItem: (key) => stored.get(key) ?? null })
    expect(restored).toEqual({ ...state, openPanel: null })
    const next = shellReducer(restored, { type: 'window/open', appId: 'writer', title: 'Escriba' })
    expect(selectActiveTemple(next).windows[1].id).not.toBe(selectActiveTemple(next).windows[0].id)
    expect(stored.has(SESSION_KEY)).toBe(true)
  })

  it('falls back on missing, corrupt, or unsupported snapshots', () => {
    for (const raw of ['null', '{}', '{', '{"version":2}', serialize({}), serialize({ ...initialShellState, temples: [] })]) {
      expect(parseSession(raw)).toBe(initialShellState)
    }
    expect(loadSession({ getItem: () => null })).toBe(initialShellState)
  })

  it('rejects invalid apps, IDs, counters, and missing active temples', () => {
    const state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    for (const patch of [{ nextId: 3 }, { nextZ: 1 }, { nextId: 3.5 }, { activeTempleId: 'missing' }]) {
      expect(parseSession(serialize({ ...state, ...patch }))).toBe(initialShellState)
    }
    for (const patch of [{ appId: 'unknown' }, { id: 'win-nope' }, { zIndex: -1 }, { minimized: 'yes' }]) {
      const temples = [{ ...state.temples[0], windows: [{ ...state.temples[0].windows[0], ...patch }] }]
      expect(parseSession(serialize({ ...state, temples }))).toBe(initialShellState)
    }
    expect(parseSession(serialize({ ...state, temples: [state.temples[0], state.temples[0]] }))).toBe(initialShellState)
  })

  it('restores snapshots saved before windows had bounds, using the cascade', () => {
    const state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const legacy = JSON.parse(JSON.stringify(state))
    for (const win of legacy.temples[0].windows) delete win.bounds
    expect(selectActiveTemple(parseSession(serialize(legacy))).windows[0].bounds).toEqual(cascadeBounds(0))
  })

  it('rejects malformed or undersized window bounds', () => {
    const state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const invalidBounds = [
      null,
      'big',
      { x: '1', y: 0, width: 400, height: 300 },
      { x: 0, y: 0, width: 100, height: 300 },
      { x: 0, y: 0, width: 400 },
    ]
    for (const bounds of invalidBounds) {
      const temples = [{ ...state.temples[0], windows: [{ ...state.temples[0].windows[0], bounds }] }]
      expect(parseSession(serialize({ ...state, temples }))).toBe(initialShellState)
    }
  })

  it('keeps the shell usable when storage is blocked or full', () => {
    expect(loadSession({ getItem: () => { throw new Error('blocked') } })).toBe(initialShellState)
    expect(saveSession(initialShellState, { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
})
