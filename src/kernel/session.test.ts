import { describe, expect, it } from 'vitest'
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

  it('restores window geometry and migrates sessions saved before geometry was added', () => {
    const state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const window = selectActiveTemple(state).windows[0]
    const restored = parseSession(serialize(state))
    expect(selectActiveTemple(restored).windows[0]).toMatchObject({
      x: window.x, y: window.y, width: window.width, height: window.height,
    })

    const { x: _x, y: _y, width: _width, height: _height, ...legacyWindow } = window
    const legacyState = {
      ...state,
      temples: state.temples.map((temple) => ({
        ...temple,
        windows: temple.windows.map(() => legacyWindow),
      })),
    }
    expect(selectActiveTemple(parseSession(serialize(legacyState))).windows[0]).toMatchObject({
      x: 60, y: 40, width: 560, height: 380,
    })
  })

  it('keeps the shell usable when storage is blocked or full', () => {
    expect(loadSession({ getItem: () => { throw new Error('blocked') } })).toBe(initialShellState)
    expect(saveSession(initialShellState, { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
})
