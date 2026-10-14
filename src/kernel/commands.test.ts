import { describe, expect, it } from 'vitest'
import { filterCommands, getCommands } from './commands'
import { initialShellState, selectActiveTemple, shellReducer } from './shellReducer'

describe('commands', () => {
  it('searches names and descriptions ignoring case and accents', () => {
    const commands = getCommands(initialShellState)
    expect(filterCommands(commands, '  TABUAS  ')[0].id).toBe('app:sheets')
    expect(filterCommands(commands, 'bloco notas')[0].id).toBe('app:notes')
    expect(filterCommands(commands, 'missing')).toEqual([])
    expect(filterCommands(commands, '')).toEqual(commands)
    expect(new Set(commands.map((c) => c.id)).size).toBe(commands.length)
  })

  it('opens apps and creates or switches temples through existing actions', () => {
    const commands = getCommands(initialShellState)
    const open = commands.find((c) => c.id === 'app:notes')!
    expect(selectActiveTemple(shellReducer(initialShellState, open.action)).windows[0].appId).toBe('notes')
    const create = commands.find((c) => c.id === 'temple:new')!
    expect(shellReducer(initialShellState, create.action).temples).toHaveLength(3)
    const activate = commands.find((c) => c.id === 'temple:temple-2')!
    expect(shellReducer(initialShellState, activate.action).activeTempleId).toBe('temple-2')
  })

  it('only lists windows in the active temple and can restore minimized windows', () => {
    let state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    const id = selectActiveTemple(state).windows[0].id
    state = shellReducer(state, { type: 'window/toggleMinimize', windowId: id })
    const focus = getCommands(state).find((c) => c.id === `window:${id}`)!
    expect(selectActiveTemple(shellReducer(state, focus.action)).windows[0].minimized).toBe(false)
    state = shellReducer(state, { type: 'temple/activate', templeId: 'temple-2' })
    expect(getCommands(state).some((c) => c.id === `window:${id}`)).toBe(false)
  })
})
