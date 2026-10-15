import { createElement, Fragment, useMemo, useState, type ReactNode } from 'react'
import { countWords, parseMarkdown, type Block, type Inline } from './markdown'
import { STORAGE_KEYS } from '../storageKeys'

const STORAGE_KEY = STORAGE_KEYS.writer

type Mode = 'edit' | 'split' | 'preview'
const modes: { id: Mode; label: string }[] = [
  { id: 'edit', label: 'Editar' },
  { id: 'split', label: 'Dividir' },
  { id: 'preview', label: 'Visualizar' },
]

function loadDocument(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return <Fragment key={i}>{node.text}</Fragment>
      case 'code':
        return <code key={i}>{node.text}</code>
      case 'strong':
        return <strong key={i}>{renderInline(node.children)}</strong>
      case 'em':
        return <em key={i}>{renderInline(node.children)}</em>
      case 'link':
        return <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">{renderInline(node.children)}</a>
    }
  })
}

function renderBlock(block: Block, i: number): ReactNode {
  switch (block.type) {
    case 'heading':
      return createElement(`h${block.level}`, { key: i }, renderInline(block.content))
    case 'paragraph':
      return <p key={i}>{renderInline(block.content)}</p>
    case 'list': {
      const items = block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)
      return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
    }
    case 'quote':
      return <blockquote key={i}>{renderInline(block.content)}</blockquote>
    case 'code':
      return <pre key={i}><code>{block.text}</code></pre>
    case 'rule':
      return <hr key={i} />
  }
}

export function WriterApp() {
  const [text, setText] = useState(loadDocument)
  const [mode, setMode] = useState<Mode>('split')
  const [saved, setSaved] = useState(true)
  const blocks = useMemo(() => parseMarkdown(text), [text])
  const words = countWords(text)

  const update = (value: string) => {
    setText(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <div className={`writer-app ${mode}`}>
      <div className="writer-toolbar" role="toolbar" aria-label="Modo de exibição">
        {modes.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
        <span className="writer-count">{words} {words === 1 ? 'palavra' : 'palavras'}</span>
      </div>
      {!saved && <p className="writer-warning" role="status">Não foi possível salvar o documento neste navegador.</p>}
      <div className="writer-panes">
        {mode !== 'preview' && (
          <textarea
            aria-label="Documento em Markdown"
            placeholder={'# Título\n\nEscreva em **Markdown**: listas, citações, `código` e [links](https://…).'}
            spellCheck
            value={text}
            onChange={(event) => update(event.target.value)}
          />
        )}
        {mode !== 'edit' && (
          <article className="writer-preview" aria-label="Pré-visualização">
            {blocks.length ? blocks.map(renderBlock) : <p className="writer-empty">A pré-visualização aparece aqui.</p>}
          </article>
        )}
      </div>
    </div>
  )
}
