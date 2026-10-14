import type { Temple } from '../kernel/types'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Contract for the "Cérebro de IA". The initial implementation is a local stub;
 * a future provider will call the AI gateway (LLM + embeddings + agents).
 */
export interface CopilotProvider {
  reply(prompt: string, context: Temple): Promise<string>
}

export const localStubProvider: CopilotProvider = {
  async reply(prompt, context) {
    const open = context.windows.map((w) => w.title)
    const ctx = open.length ? `Contexto do Templo "${context.name}": ${open.join(', ')}.` : `O Templo "${context.name}" está vazio.`
    return `${ctx} Recebi: "${prompt}". (Modo offline — conecte um provedor de IA para respostas reais.)`
  },
}
