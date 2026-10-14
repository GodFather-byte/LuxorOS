import { useState, type FormEvent } from 'react'
import { localStubProvider, type CopilotMessage } from '../../ai/copilot'
import type { Temple } from '../../kernel/types'

export function AiPanel({ temple }: { temple: Temple }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { role: 'assistant', content: 'Saudações. Sou o Copiloto do LuxorOS. Como posso ajudar?' },
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
      const reply = await localStubProvider.reply(prompt, temple)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
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
          placeholder="Pergunte ao Copiloto…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={busy}>Enviar</button>
      </form>
    </div>
  )
}
