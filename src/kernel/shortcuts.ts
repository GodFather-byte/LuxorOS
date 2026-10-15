import { selectActiveTemple } from './shellReducer'
import type { ShellAction, ShellState } from './types'

/** The keystroke fields a shortcut reads. A DOM KeyboardEvent satisfies this shape. */
export interface ShortcutKey {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/**
 * Maps Ctrl/Cmd+Shift+arrow to a shell action, or null when the shell does not handle the keystroke.
 * Ctrl+Shift+←/→ switch Templos; Ctrl+Shift+↑/↓ move focus between the windows of the active Templo.
 * Alt is excluded so the chord never overlaps with system or browser combinations.
 */
export function resolveShortcut(input: ShortcutKey, state: ShellState): ShellAction | null {
  if (!(input.ctrlKey || input.metaKey) || !input.shiftKey || input.altKey) return null
  switch (input.key) {
    case 'ArrowLeft':
    case 'ArrowRight': {
      const index = state.temples.findIndex((t) => t.id === state.activeTempleId)
      const target = wrapAt(state.temples, index, input.key === 'ArrowLeft' ? -1 : 1)
      return target && target.id !== state.activeTempleId ? { type: 'temple/activate', templeId: target.id } : null
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const windows = selectActiveTemple(state).windows
      if (windows.length === 0) return null
      const top = windows.reduce((a, b) => (b.zIndex > a.zIndex ? b : a))
      const target = wrapAt(windows, windows.indexOf(top), input.key === 'ArrowUp' ? -1 : 1)
      return target && target !== top ? { type: 'window/focus', windowId: target.id } : null
    }
    default:
      return null
  }
}

/** Neighbour in a cyclic list; `undefined` only when the list is empty. */
function wrapAt<T>(items: T[], index: number, delta: number): T | undefined {
  if (items.length === 0) return undefined
  return items[(index + delta + items.length) % items.length]
}
