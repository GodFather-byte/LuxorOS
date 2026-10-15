import { appRegistry } from '../apps/registry'
import { initialShellState } from './shellReducer'
import type { ShellState } from './types'

export const SESSION_KEY = 'luxoros:session:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseSession(raw: string): ShellState {
  try {
    const data: unknown = JSON.parse(raw)
    if (!isRecord(data) || data.version !== 1 || !isRecord(data.state)) return initialShellState
    const state = data.state
    if (!Array.isArray(state.temples) || state.temples.length === 0) return initialShellState
    const ids = new Set<string>()
    let maxId = 0
    let maxZ = 0
    const validId = (id: unknown, prefix: string) => {
      if (typeof id !== 'string' || !new RegExp(`^${prefix}-[1-9]\\d*$`).test(id) || ids.has(id)) return false
      const number = Number(id.slice(prefix.length + 1))
      if (!Number.isSafeInteger(number)) return false
      ids.add(id)
      maxId = Math.max(maxId, number)
      return true
    }
    for (const temple of state.temples) {
      if (!isRecord(temple) || !validId(temple.id, 'temple') ||
        typeof temple.name !== 'string' || typeof temple.glyph !== 'string' ||
        !Array.isArray(temple.windows)) return initialShellState
      for (const [windowIndex, win] of temple.windows.entries()) {
        if (!isRecord(win) || !validId(win.id, 'win') ||
          !appRegistry.some((app) => app.id === win.appId) ||
          typeof win.title !== 'string' || typeof win.minimized !== 'boolean' ||
          typeof win.zIndex !== 'number' || !Number.isSafeInteger(win.zIndex) ||
          win.zIndex < 1) return initialShellState
        const geometryKeys = ['x', 'y', 'width', 'height']
        const hasGeometry = geometryKeys.every((key) => key in win)
        const hasPartialGeometry = geometryKeys.some((key) => key in win) && !hasGeometry
        if (hasPartialGeometry) return initialShellState
        if (hasGeometry) {
          const { x, y, width, height } = win
          if (![x, y, width, height].every((value) => typeof value === 'number' &&
            Number.isSafeInteger(value)) ||
            (x as number) < 0 || (y as number) < 0 ||
            (width as number) < 200 || (width as number) > 10000 ||
            (height as number) < 140 || (height as number) > 10000) return initialShellState
        } else {
          const offset = (windowIndex % 6) * 28
          Object.assign(win, { x: 60 + offset, y: 40 + offset, width: 560, height: 380 })
        }
        maxZ = Math.max(maxZ, win.zIndex)
      }
    }
    if (!state.temples.some((t) => t.id === state.activeTempleId) ||
      typeof state.nextId !== 'number' || !Number.isSafeInteger(state.nextId) ||
      state.nextId <= maxId || state.nextId >= Number.MAX_SAFE_INTEGER ||
      typeof state.nextZ !== 'number' || !Number.isSafeInteger(state.nextZ) ||
      state.nextZ <= maxZ || state.nextZ >= Number.MAX_SAFE_INTEGER) return initialShellState
    return { ...state, openPanel: null } as unknown as ShellState
  } catch {
    return initialShellState
  }
}

export function loadSession(storage?: Pick<Storage, 'getItem'>): ShellState {
  try {
    const raw = (storage ?? localStorage).getItem(SESSION_KEY)
    return raw ? parseSession(raw) : initialShellState
  } catch {
    return initialShellState
  }
}

export function saveSession(state: ShellState, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? localStorage).setItem(SESSION_KEY, JSON.stringify({ version: 1, state }))
    return true
  } catch {
    return false
  }
}
