import { useState } from 'react'
import { resolveAddress, type Destination } from './address'

const STORAGE_KEY = 'luxoros:portal:v1'
// No allow-same-origin: framed pages run in an opaque origin and can never reach LuxorOS storage or DOM.
const SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox'

const suggestions = [
  { label: 'example.com', address: 'https://example.com' },
  { label: 'Mapa de Luxor (OpenStreetMap)', address: 'https://www.openstreetmap.org/export/embed.html?bbox=32.60%2C25.68%2C32.68%2C25.73&layer=mapnik' },
]

interface Navigation {
  entries: Destination[]
  index: number // -1 shows the start page
}

function loadLastPage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function rememberPage(destination: Destination | undefined) {
  if (destination?.kind !== 'page') return
  try {
    localStorage.setItem(STORAGE_KEY, destination.url)
  } catch {
    // Not remembering the last page is harmless.
  }
}

const addressOf = (destination: Destination | undefined) =>
  destination === undefined ? '' : destination.kind === 'page' ? destination.url : destination.kind === 'search' ? destination.query : destination.input

export function PortalApp() {
  const [nav, setNav] = useState<Navigation>(() => {
    const last = resolveAddress(loadLastPage())
    return last?.kind === 'page' ? { entries: [last], index: 0 } : { entries: [], index: -1 }
  })
  const current = nav.index >= 0 ? nav.entries[nav.index] : undefined
  const [input, setInput] = useState(() => addressOf(current))

  const go = (text: string) => {
    const destination = resolveAddress(text)
    if (!destination) return
    setNav({ entries: [...nav.entries.slice(0, nav.index + 1), destination], index: nav.index + 1 })
    setInput(addressOf(destination))
    rememberPage(destination)
  }

  const move = (step: number) => {
    const index = nav.index + step
    if (index < -1 || index >= nav.entries.length) return
    setNav({ ...nav, index })
    setInput(addressOf(nav.entries[index]))
    rememberPage(nav.entries[index])
  }

  return (
    <div className="portal-app">
      <form className="portal-bar" onSubmit={(event) => { event.preventDefault(); go(input) }}>
        <button type="button" aria-label="Voltar" disabled={nav.index < 0} onClick={() => move(-1)}>←</button>
        <button type="button" aria-label="Avançar" disabled={nav.index >= nav.entries.length - 1} onClick={() => move(1)}>→</button>
        <input
          aria-label="Endereço"
          placeholder="Digite um endereço ou pesquise"
          spellCheck={false}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit">Ir</button>
      </form>
      {!current && (
        <div className="portal-start">
          <h2>Portal</h2>
          <p>Abra um endereço na barra acima ou comece por aqui:</p>
          <ul>
            {suggestions.map((s) => (
              <li key={s.address}><button type="button" onClick={() => go(s.address)}>{s.label}</button></li>
            ))}
          </ul>
        </div>
      )}
      {current?.kind === 'page' && (
        <>
          <p className="portal-hint">
            Alguns sites não permitem ser exibidos dentro de outra página.{' '}
            <a href={current.url} target="_blank" rel="noopener noreferrer">Abrir em nova aba</a>
          </p>
          <iframe key={nav.index} title={`Página: ${current.url}`} src={current.url} sandbox={SANDBOX} referrerPolicy="no-referrer" />
        </>
      )}
      {current?.kind === 'search' && (
        <div className="portal-message">
          <p>Pesquisas abrem em nova aba, porque os buscadores não permitem ser exibidos dentro do Portal.</p>
          <a href={current.url} target="_blank" rel="noopener noreferrer">Pesquisar “{current.query}”</a>
        </div>
      )}
      {current?.kind === 'invalid' && (
        <div className="portal-message" role="alert">
          <p>{current.reason}</p>
        </div>
      )}
    </div>
  )
}
