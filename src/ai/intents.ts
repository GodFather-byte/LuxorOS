import { getApp } from '../apps/registry'
import type { AppId, PanelId, ShellAction, ShellState } from '../kernel/types'

/** What the Copiloto answers and the shell actions it asks the shell to run. */
export interface CopilotResponse {
  text: string
  actions?: ShellAction[]
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ').trim()

const APP_ALIASES: Record<string, AppId> = {
  papiro: 'notes', nota: 'notes', notas: 'notes', 'bloco de notas': 'notes',
  tabuas: 'sheets', tabua: 'sheets', planilha: 'sheets', planilhas: 'sheets',
  escriba: 'writer', editor: 'writer', 'editor de texto': 'writer', documento: 'writer',
  portal: 'browser', navegador: 'browser', internet: 'browser', web: 'browser',
}
const PANEL_ALIASES: Record<string, PanelId> = { arquivos: 'files', ferramentas: 'tools' }

const OPEN = /^(?:abr(?:ir|a|e)|inici(?:ar|e|a)|lanc(?:ar|e|a)|mostr(?:ar|e|a))\s+(?:o |a |os |as |um |uma )?(.+)$/
const SWITCH = /^(?:ir|va|vai|mudar|mude|muda|trocar|troque|troca)\s+(?:para|pro|pra)\s+(?:o )?(?:templo )?(.+)$/
const CREATE = /^(?:crie|criar|cria|novo|nova)\s+(?:um\s+)?templo(?:\s+(?:chamado|chamada|com o nome))?\s*(.*)$/i
const ALL_WINDOWS = '(?:todas as janelas|as janelas|janelas|tudo)'
const CLOSE_ALL = new RegExp(`^(?:fechar|feche|fecha)\\s+${ALL_WINDOWS}$`)
const MINIMIZE_ALL = new RegExp(`^(?:minimizar|minimize|minimiza)\\s+${ALL_WINDOWS}$`)
const HELP = /^(?:ajuda|help|comandos|\?|o que (?:voce )?(?:faz|sabe fazer))$/

export const HELP_TEXT =
  'Posso abrir aplicativos ("abra as Tábuas"), criar Templos ("crie um templo chamado Viagem"), ' +
  'trocar de Templo ("vá para Karnak"), abrir os painéis Arquivos e Ferramentas, ' +
  'e fechar ou minimizar todas as janelas do Templo atual.'

/**
 * Understands a small set of Portuguese commands and turns them into shell actions.
 * Returns null when the prompt is not a command, so the provider can answer it another way.
 */
export function interpretCommand(prompt: string, state: ShellState): CopilotResponse | null {
  const text = normalize(prompt)
  const temple = state.temples.find((t) => t.id === state.activeTempleId) ?? state.temples[0]

  if (HELP.test(text)) return { text: HELP_TEXT }

  const create = CREATE.exec(prompt.trim().replace(/[.!?]+$/, ''))
  if (create) {
    const name = create[1].replace(/^["“'«]+|["”'»]+$/g, '').trim() || `Templo ${state.temples.length + 1}`
    return { text: `Templo “${name}” criado.`, actions: [{ type: 'temple/create', name }] }
  }

  const switchTo = SWITCH.exec(text)
  if (switchTo) {
    const target = state.temples.find((t) => normalize(t.name) === switchTo[1])
    if (!target) return { text: `Não encontrei o Templo “${switchTo[1]}”.` }
    return { text: `Indo para o Templo ${target.name}.`, actions: [{ type: 'temple/activate', templeId: target.id }] }
  }

  if (CLOSE_ALL.test(text)) {
    if (!temple.windows.length) return { text: 'Não há janelas abertas neste Templo.' }
    return {
      text: `Fechando ${temple.windows.length === 1 ? '1 janela' : `${temple.windows.length} janelas`}.`,
      actions: temple.windows.map((w) => ({ type: 'window/close', windowId: w.id })),
    }
  }

  if (MINIMIZE_ALL.test(text)) {
    const visible = temple.windows.filter((w) => !w.minimized)
    if (!visible.length) return { text: 'Não há janelas visíveis para minimizar.' }
    return { text: 'Janelas minimizadas.', actions: visible.map((w) => ({ type: 'window/toggleMinimize', windowId: w.id })) }
  }

  const open = OPEN.exec(text)
  if (open) {
    const object = open[1]
    // Own keys only: "abrir constructor" must not resolve to Object.prototype.constructor.
    if (Object.hasOwn(APP_ALIASES, object)) {
      const appId = APP_ALIASES[object]
      const app = getApp(appId)
      return { text: `Abrindo ${app.name}.`, actions: [{ type: 'window/open', appId, title: app.name }] }
    }
    const panelName = object.replace(/^(?:o |a )?painel (?:de )?/, '')
    if (Object.hasOwn(PANEL_ALIASES, panelName)) {
      const panel = PANEL_ALIASES[panelName]
      const label = panel === 'files' ? 'Arquivos' : 'Ferramentas'
      if (state.openPanel === panel) return { text: `O painel ${label} já está aberto.` }
      return { text: `Abrindo o painel ${label}.`, actions: [{ type: 'panel/toggle', panel }] }
    }
    const templeName = object.replace(/^templo /, '')
    const target = state.temples.find((t) => normalize(t.name) === templeName)
    if (target) return { text: `Indo para o Templo ${target.name}.`, actions: [{ type: 'temple/activate', templeId: target.id }] }
    return { text: `Não conheço “${object}”. Experimente Papiro, Tábuas, Escriba ou Portal.` }
  }

  return null
}
