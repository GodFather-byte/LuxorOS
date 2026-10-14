import { useEffect, useRef, useState } from 'react'
import { filterCommands, getCommands } from '../../kernel/commands'
import type { ShellAction, ShellState } from '../../kernel/types'

interface Props {
  state: ShellState
  onCommand: (action: ShellAction) => void
  onClose: () => void
}

export function CommandPalette({ state, onCommand, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const commands = filterCommands(getCommands(state), query)
  const active = Math.min(selected, Math.max(0, commands.length - 1))

  useEffect(() => {
    const previous = document.activeElement
    const dialog = dialogRef.current!
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  useEffect(() => {
    dialogRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, query])

  const execute = (index: number) => {
    const command = commands[index]
    if (!command) return
    onCommand(command.action)
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="command-palette" aria-labelledby="command-title" onCancel={onClose}>
      <div className="command-header">
        <h2 id="command-title">Comandos do LuxorOS</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar comandos">×</button>
      </div>
      <input
        role="combobox"
        aria-label="Buscar comandos"
        aria-expanded="true"
        aria-controls="command-results"
        aria-autocomplete="list"
        aria-activedescendant={commands.length ? `command-${commands[active].id}` : undefined}
        placeholder="Buscar aplicativos, Templos e janelas…"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setSelected(0) }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (commands.length) setSelected((active + (event.key === 'ArrowDown' ? 1 : -1) + commands.length) % commands.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            execute(active)
          }
        }}
      />
      <ul id="command-results" role="listbox" aria-label="Comandos disponíveis">
        {commands.map((command, index) => (
          <li
            key={command.id}
            id={`command-${command.id}`}
            role="option"
            aria-selected={index === active}
            onClick={() => execute(index)}
          >
            <span>{command.label}</span>
            <small>{command.detail}</small>
          </li>
        ))}
      </ul>
      {!commands.length && <p role="status">Nenhum comando encontrado.</p>}
      <footer>↑ ↓ selecionar · Enter executar · Esc fechar</footer>
    </dialog>
  )
}
