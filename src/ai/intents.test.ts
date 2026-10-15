import { describe, expect, it } from 'vitest'
import { initialShellState, selectActiveTemple, shellReducer } from '../kernel/shellReducer'
import type { ShellState } from '../kernel/types'
import { localProvider } from './copilot'
import { HELP_TEXT, interpretCommand } from './intents'

/** Runs the command's actions through the real reducer. */
function run(prompt: string, state: ShellState = initialShellState) {
  const response = interpretCommand(prompt, state)
  const next = (response?.actions ?? []).reduce(shellReducer, state)
  return { response, next }
}

describe('interpretCommand', () => {
  it('opens apps by name or alias, ignoring case, accents, articles, and punctuation', () => {
    for (const [prompt, title] of [['Abra as Tábuas!', 'Tábuas'], ['abrir o navegador', 'Portal'], ['inicie o editor', 'Escriba'], ['ABRE PAPIRO.', 'Papiro']]) {
      const { response, next } = run(prompt)
      expect(response?.text).toBe(`Abrindo ${title}.`)
      expect(selectActiveTemple(next).windows.map((w) => w.title)).toEqual([title])
    }
  })

  it('answers unknown targets without acting, including Object prototype names', () => {
    for (const prompt of ['abrir foguete', 'abrir constructor', 'abra o toString']) {
      const { response, next } = run(prompt)
      expect(response?.text).toMatch(/^Não conheço/)
      expect(response?.actions).toBeUndefined()
      expect(next).toBe(initialShellState)
    }
  })

  it('creates Templos with the name as typed, or a numbered default', () => {
    const named = run('Crie um templo chamado “Viagem ao Nilo”')
    expect(named.response?.text).toBe('Templo “Viagem ao Nilo” criado.')
    expect(selectActiveTemple(named.next).name).toBe('Viagem ao Nilo')
    expect(selectActiveTemple(run('novo templo').next).name).toBe('Templo 3')
  })

  it('switches to an existing Templo and reports unknown ones', () => {
    expect(run('vá para Viagem').next.activeTempleId).toBe('temple-2')
    expect(run('ir para o templo karnak', { ...initialShellState, activeTempleId: 'temple-2' }).next.activeTempleId).toBe('temple-1')
    expect(run('abrir templo viagem').next.activeTempleId).toBe('temple-2')
    const unknown = run('vá para Tebas')
    expect(unknown.response?.text).toBe('Não encontrei o Templo “tebas”.')
    expect(unknown.next).toBe(initialShellState)
  })

  it('closes or minimizes every window of the active Templo only', () => {
    let state = shellReducer(initialShellState, { type: 'window/open', appId: 'notes', title: 'Papiro' })
    state = shellReducer(state, { type: 'window/open', appId: 'sheets', title: 'Tábuas' })
    state = shellReducer(state, { type: 'temple/activate', templeId: 'temple-2' })
    state = shellReducer(state, { type: 'window/open', appId: 'writer', title: 'Escriba' })
    state = shellReducer(state, { type: 'temple/activate', templeId: 'temple-1' })

    const minimized = run('minimize todas as janelas', state)
    expect(selectActiveTemple(minimized.next).windows.every((w) => w.minimized)).toBe(true)
    expect(run('minimizar tudo', minimized.next).response?.actions).toBeUndefined()

    const closed = run('feche todas as janelas', state)
    expect(closed.response?.text).toBe('Fechando 2 janelas.')
    expect(selectActiveTemple(closed.next).windows).toEqual([])
    expect(closed.next.temples[1].windows).toHaveLength(1)
    expect(run('fechar tudo').response?.text).toBe('Não há janelas abertas neste Templo.')
  })

  it('opens the Arquivos and Ferramentas panels once', () => {
    expect(run('abrir arquivos').next.openPanel).toBe('files')
    expect(run('abra o painel de ferramentas').next.openPanel).toBe('tools')
    const open = { ...initialShellState, openPanel: 'files' as const }
    expect(run('abrir arquivos', open).response).toEqual({ text: 'O painel Arquivos já está aberto.' })
  })

  it('explains itself on request and ignores free text', () => {
    expect(interpretCommand('Ajuda', initialShellState)).toEqual({ text: HELP_TEXT })
    expect(interpretCommand('o que você sabe fazer?', initialShellState)).toEqual({ text: HELP_TEXT })
    expect(interpretCommand('qual a capital do Egito?', initialShellState)).toBeNull()
  })
})

describe('localProvider', () => {
  it('runs commands and falls back to an offline explanation for free text', async () => {
    expect((await localProvider.reply('abra o portal', initialShellState)).actions).toHaveLength(1)
    const fallback = await localProvider.reply('qual a capital do Egito?', initialShellState)
    expect(fallback.actions).toBeUndefined()
    expect(fallback.text).toContain('digite "ajuda"')
  })
})
