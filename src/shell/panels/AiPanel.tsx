import { useState, type FormEvent } from 'react'
import { localProvider, type CopilotMessage } from '../../ai/copilot'
import type { ShellAction, ShellState } from '../../kernel/types'

interface Props {
  state: ShellState
  onAction: (action: ShellAction) => void
}

export function AiPanel({ state, onAction }: Props) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { role: 'assistant', content: 'Saudações. Sou o Copiloto do LuxorOS. Digite "ajuda" para ver o que posso fazer.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(e: FormEvent) {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: prompt }])
    setBusy(true)
    try {
      const response = await localProvider.reply(prompt, state)
      setMessages((m) => [...m, { role: 'assistant', content: response.text }])
      response.actions?.forEach(onAction)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ai-panel">
      <ol className="chat" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`msg ${m.role}`}>{m.content}</li>
        ))}
      </ol>
      <form className="chat-input" onSubmit={send}>
        <input
          aria-label="Mensagem para o Copiloto"
          placeholder="Ex.: abra as Tábuas"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={busy}>Enviar</button>
      </form>
    </div>
  )
}
