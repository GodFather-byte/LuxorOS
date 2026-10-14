import { appRegistry } from '../apps/registry'
import type { ShellAction, ShellState } from './types'

export interface ShellCommand {
  id: string
  label: string
  detail: string
  action: ShellAction
}

export function getCommands(state: ShellState): ShellCommand[] {
  return [
    ...appRegistry.map((app): ShellCommand => ({
      id: `app:${app.id}`, label: `Abrir ${app.name}`, detail: app.description,
      action: { type: 'window/open', appId: app.id, title: app.name },
    })),
    { id: 'temple:new', label: 'Novo Templo', detail: 'Criar espaço de trabalho',
      action: { type: 'temple/create', name: `Templo ${state.temples.length + 1}` } },
    ...state.temples.map((temple): ShellCommand => ({
      id: `temple:${temple.id}`, label: `Ir para ${temple.name}`, detail: 'Templo de Trabalho',
      action: { type: 'temple/activate', templeId: temple.id },
    })),
    ...state.temples.find((t) => t.id === state.activeTempleId)!.windows.map((win): ShellCommand => ({
      id: `window:${win.id}`, label: `Focar ${win.title}`, detail: win.minimized ? 'Janela minimizada' : 'Janela aberta',
      action: { type: 'window/focus', windowId: win.id },
    })),
    ...(['ai', 'tools', 'files'] as const).map((panel): ShellCommand => ({
      id: `panel:${panel}`,
      label: { ai: 'Copiloto', tools: 'Ferramentas', files: 'Arquivos' }[panel],
      detail: 'Alternar painel', action: { type: 'panel/toggle', panel },
    })),
  ]
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function filterCommands(commands: ShellCommand[], query: string): ShellCommand[] {
  const terms = normalize(query).trim().split(/\s+/)
  return commands.filter((command) => terms.every((term) => normalize(`${command.label} ${command.detail}`).includes(term)))
}
