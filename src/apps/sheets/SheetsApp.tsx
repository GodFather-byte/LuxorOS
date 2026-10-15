import { useRef, useState, type KeyboardEvent } from 'react'
import { cellRef, columnLabel, COLUMNS, createEvaluator, formatValue, parseRef, ROWS, type Cells } from './engine'

const STORAGE_KEY = 'luxoros:sheets:v1'
const columns = Array.from({ length: COLUMNS }, (_, i) => i)
const rows = Array.from({ length: ROWS }, (_, i) => i)

/** Keeps only canonical references ("A1", not "a1") with string contents; anything else starts empty. */
function loadCells(): Cells {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    return Object.fromEntries(Object.entries(data).filter(([ref, raw]) => {
      const position = parseRef(ref)
      return position && cellRef(position.col, position.row) === ref && typeof raw === 'string'
    }))
  } catch {
    return {}
  }
}

function saveCells(cells: Cells): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cells))
    return true
  } catch {
    return false
  }
}

export function SheetsApp() {
  const [cells, setCells] = useState<Cells>(loadCells)
  const [editing, setEditing] = useState<{ ref: string; draft: string } | null>(null)
  const [saved, setSaved] = useState(true)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const cancelled = useRef(false)
  const valueOf = createEvaluator(cells)

  // Every edit is committed on blur, so Enter and the arrow keys only move focus.
  const commit = (ref: string, draft: string) => {
    if ((cells[ref] ?? '') === draft) return
    const next = { ...cells }
    if (draft.trim() === '') delete next[ref]
    else next[ref] = draft
    setCells(next)
    setSaved(saveCells(next))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, col: number, row: number) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Escape') {
      cancelled.current = true
      event.currentTarget.blur()
      return
    }
    const step = event.key === 'Enter' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (step === 0 || (event.key === 'Enter' && event.shiftKey)) return
    event.preventDefault()
    const target = inputs.current.get(cellRef(col, row + step))
    if (target) target.focus()
    else event.currentTarget.blur()
  }

  return (
    <div className="sheets-app">
      <p className="sheets-hint">
        Digite <code>=</code> para fórmulas: <code>=SOMA(A1:A5)</code>, <code>=MÉDIA(B1:B3)</code>, MÍN, MÁX e <code>+ - * /</code>.
      </p>
      {!saved && <p className="sheets-warning" role="status">Não foi possível salvar a planilha neste navegador.</p>}
      <div className="sheets-scroll">
        <table className="sheets-grid" aria-label="Planilha">
          <thead>
            <tr>
              <th aria-hidden="true" />
              {columns.map((col) => <th key={col} scope="col">{columnLabel(col)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <th scope="row">{row + 1}</th>
                {columns.map((col) => {
                  const ref = cellRef(col, row)
                  const value = valueOf(ref)
                  const isEditing = editing?.ref === ref
                  return (
                    <td key={col}>
                      <input
                        ref={(element) => {
                          if (element) inputs.current.set(ref, element)
                          else inputs.current.delete(ref)
                        }}
                        aria-label={`Célula ${ref}`}
                        className={isEditing ? undefined : value.kind}
                        value={isEditing ? editing.draft : formatValue(value)}
                        spellCheck={false}
                        onFocus={() => setEditing({ ref, draft: cells[ref] ?? '' })}
                        onChange={(event) => setEditing({ ref, draft: event.target.value })}
                        onBlur={() => {
                          if (cancelled.current) cancelled.current = false
                          else if (isEditing) commit(ref, editing.draft)
                          setEditing(null)
                        }}
                        onKeyDown={(event) => onKeyDown(event, col, row)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
