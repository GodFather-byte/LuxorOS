import type { ShellAction, ShellState, Temple } from './types'

export const initialShellState: ShellState = {
  temples: [
    { id: 'temple-1', name: 'Karnak', glyph: '𓂀', windows: [] },
    { id: 'temple-2', name: 'Viagem', glyph: '𓊝', windows: [] },
  ],
  activeTempleId: 'temple-1',
  openPanel: null,
  nextZ: 1,
  nextId: 3,
}

function updateActiveTemple(state: ShellState, update: (temple: Temple) => Temple): ShellState {
  return {
    ...state,
    temples: state.temples.map((t) => (t.id === state.activeTempleId ? update(t) : t)),
  }
}

export function shellReducer(state: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case 'temple/create': {
      const id = `temple-${state.nextId}`
      const temple: Temple = { id, name: action.name, glyph: action.glyph ?? '𓋹', windows: [] }
      return { ...state, temples: [...state.temples, temple], activeTempleId: id, nextId: state.nextId + 1 }
    }
    case 'temple/activate':
      if (!state.temples.some((t) => t.id === action.templeId)) return state
      return { ...state, activeTempleId: action.templeId }
    case 'window/open': {
      const id = `win-${state.nextId}`
      const next = updateActiveTemple(state, (t) => ({
        ...t,
        windows: [...t.windows, { id, appId: action.appId, title: action.title, minimized: false, zIndex: state.nextZ }],
      }))
      return { ...next, nextZ: state.nextZ + 1, nextId: state.nextId + 1 }
    }
    case 'window/close':
      return updateActiveTemple(state, (t) => ({ ...t, windows: t.windows.filter((w) => w.id !== action.windowId) }))
    case 'window/focus': {
      const next = updateActiveTemple(state, (t) => ({
        ...t,
        windows: t.windows.map((w) =>
          w.id === action.windowId ? { ...w, minimized: false, zIndex: state.nextZ } : w,
        ),
      }))
      return { ...next, nextZ: state.nextZ + 1 }
    }
    case 'window/toggleMinimize':
      return updateActiveTemple(state, (t) => ({
        ...t,
        windows: t.windows.map((w) => (w.id === action.windowId ? { ...w, minimized: !w.minimized } : w)),
      }))
    case 'window/setGeometry':
      if (
        !Number.isFinite(action.geometry.x) || action.geometry.x < 0 ||
        !Number.isFinite(action.geometry.y) || action.geometry.y < 0 ||
        !Number.isFinite(action.geometry.width) || action.geometry.width <= 0 ||
        !Number.isFinite(action.geometry.height) || action.geometry.height <= 0
      ) return state
      return updateActiveTemple(state, (t) => ({
        ...t,
        windows: t.windows.map((w) => (w.id === action.windowId ? { ...w, geometry: action.geometry } : w)),
      }))
    case 'panel/toggle':
      return { ...state, openPanel: state.openPanel === action.panel ? null : action.panel }
    default:
      return state
  }
}

export function selectActiveTemple(state: ShellState): Temple {
  return state.temples.find((t) => t.id === state.activeTempleId) ?? state.temples[0]
}
