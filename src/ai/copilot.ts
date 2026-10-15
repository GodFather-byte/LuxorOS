import { selectActiveTemple } from '../kernel/shellReducer'
import type { ShellState } from '../kernel/types'
import { interpretCommand, type CopilotResponse } from './intents'

export type { CopilotResponse } from './intents'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Contract for the "Cérebro de IA". A provider answers with text and, optionally, shell actions for the
 * shell to run: the shape a tool-calling model behind the future AI gateway would return.
 */
export interface CopilotProvider {
  reply(prompt: string, state: ShellState): Promise<CopilotResponse>
}

/** Offline provider: understands a small set of Portuguese commands and explains its limits otherwise. */
export const localProvider: CopilotProvider = {
  async reply(prompt, state) {
    const command = interpretCommand(prompt, state)
    if (command) return command
    const temple = selectActiveTemple(state)
    const open = temple.windows.map((w) => w.title)
    const ctx = open.length ? `Contexto do Templo "${temple.name}": ${open.join(', ')}.` : `O Templo "${temple.name}" está vazio.`
    return { text: `${ctx} Recebi: "${prompt}". No modo offline entendo apenas comandos; digite "ajuda" para ver quais.` }
  },
}
