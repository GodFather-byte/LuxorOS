/** Spreadsheet engine for Tábuas: parses and evaluates cell formulas. Pure, no React or DOM. */

export const COLUMNS = 8
export const ROWS = 20

export type ErrorCode = '#ERRO!' | '#REF!' | '#DIV/0!' | '#CICLO!' | '#NOME?' | '#VALOR!'

export type CellValue =
  | { kind: 'empty' }
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'error'; code: ErrorCode }

/** Raw cell contents as typed by the user, keyed by reference ("A1"). */
export type Cells = Record<string, string>

interface Position {
  col: number
  row: number
}

export function columnLabel(col: number): string {
  return String.fromCharCode(65 + col)
}

export function cellRef(col: number, row: number): string {
  return `${columnLabel(col)}${row + 1}`
}

/** Zero-based position of a reference inside the grid, or null when malformed or out of bounds. */
export function parseRef(ref: string): Position | null {
  const match = /^([A-Za-z])([1-9]\d*)$/.exec(ref)
  if (!match) return null
  const col = match[1].toUpperCase().charCodeAt(0) - 65
  const row = Number(match[2]) - 1
  return col < COLUMNS && row < ROWS ? { col, row } : null
}

const error = (code: ErrorCode): CellValue => ({ kind: 'error', code })
const number = (value: number): CellValue => (Number.isFinite(value) ? { kind: 'number', value } : error('#VALOR!'))

/** Plain (non-formula) input: numbers accept a pt-BR decimal comma, anything else is text. */
function literal(raw: string): CellValue {
  const text = raw.trim()
  if (text === '') return { kind: 'empty' }
  if (/^[-+]?\d+([.,]\d+)?$/.test(text)) return number(Number(text.replace(',', '.')))
  return { kind: 'text', value: raw }
}

// ---- Parser -------------------------------------------------------------------------------

type Node =
  | { type: 'num'; value: number }
  | { type: 'ref'; ref: string }
  | { type: 'range'; from: string; to: string }
  | { type: 'call'; name: string; args: Node[] }
  | { type: 'neg'; arg: Node }
  | { type: 'bin'; op: '+' | '-' | '*' | '/'; left: Node; right: Node }

class ParseError extends Error {}

function tokenize(source: string): string[] {
  const tokens: string[] = []
  const pattern = /\s*(\d+(?:\.\d+)?|[A-Za-z]+\d+|[A-Za-zÀ-ÖØ-öø-ÿ]+|[-+*/():,;])/y
  let index = 0
  while (index < source.length) {
    pattern.lastIndex = index
    const match = pattern.exec(source)
    if (!match) {
      if (source.slice(index).trim() === '') break
      throw new ParseError()
    }
    tokens.push(match[1])
    index = pattern.lastIndex
  }
  return tokens
}

function parse(source: string): Node {
  const tokens = tokenize(source)
  let position = 0
  const peek = () => tokens[position]
  const take = (expected?: string) => {
    const token = tokens[position]
    if (token === undefined || (expected !== undefined && token !== expected)) throw new ParseError()
    position++
    return token
  }

  const expression = (): Node => {
    let node = term()
    while (peek() === '+' || peek() === '-') {
      const op = take() as '+' | '-'
      node = { type: 'bin', op, left: node, right: term() }
    }
    return node
  }
  const term = (): Node => {
    let node = factor()
    while (peek() === '*' || peek() === '/') {
      const op = take() as '*' | '/'
      node = { type: 'bin', op, left: node, right: factor() }
    }
    return node
  }
  const factor = (): Node => {
    const token = take()
    if (token === '-') return { type: 'neg', arg: factor() }
    if (token === '+') return factor()
    if (token === '(') {
      const inner = expression()
      take(')')
      return inner
    }
    if (/^\d/.test(token)) return { type: 'num', value: Number(token) }
    if (/^[A-Za-z]+\d+$/.test(token)) {
      const from = token.toUpperCase()
      if (peek() === ':') {
        take()
        const to = take()
        if (!/^[A-Za-z]+\d+$/.test(to)) throw new ParseError()
        return { type: 'range', from, to: to.toUpperCase() }
      }
      return { type: 'ref', ref: from }
    }
    if (/^[A-Za-zÀ-ÿ]/.test(token) && peek() === '(') {
      take('(')
      const args: Node[] = []
      if (peek() !== ')') {
        args.push(expression())
        while (peek() === ',' || peek() === ';') {
          take()
          args.push(expression())
        }
      }
      take(')')
      return { type: 'call', name: token, args }
    }
    throw new ParseError()
  }

  const node = expression()
  if (position !== tokens.length) throw new ParseError()
  return node
}

// ---- Evaluation ---------------------------------------------------------------------------

const FUNCTIONS: Record<string, (values: number[]) => CellValue> = {
  SUM: (values) => number(values.reduce((a, b) => a + b, 0)),
  AVERAGE: (values) => (values.length ? number(values.reduce((a, b) => a + b, 0) / values.length) : error('#DIV/0!')),
  MIN: (values) => number(values.length ? Math.min(...values) : 0),
  MAX: (values) => number(values.length ? Math.max(...values) : 0),
}
const ALIASES: Record<string, string> = { SOMA: 'SUM', MEDIA: 'AVERAGE' }

function functionFor(name: string) {
  const key = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return FUNCTIONS[ALIASES[key] ?? key]
}

/**
 * Evaluates every formula on demand with memoisation. A reference back into a cell that is still
 * being evaluated is a cycle, reported as #CICLO! on every cell that depends on it.
 */
export function createEvaluator(cells: Cells): (ref: string) => CellValue {
  const memo = new Map<string, CellValue>()
  const visiting = new Set<string>()

  const valueOf = (ref: string): CellValue => {
    const cached = memo.get(ref)
    if (cached) return cached
    if (visiting.has(ref)) return error('#CICLO!')
    const raw = cells[ref] ?? ''
    if (!raw.startsWith('=')) {
      const value = literal(raw)
      memo.set(ref, value)
      return value
    }
    visiting.add(ref)
    let value: CellValue
    try {
      const node = parse(raw.slice(1))
      // A bare reference ("=A1") shows the referenced value as is, text included.
      value = node.type === 'ref' ? referenced(node.ref, true) : evaluate(node)
    } catch (caught) {
      if (!(caught instanceof ParseError)) throw caught
      value = error('#ERRO!')
    }
    visiting.delete(ref)
    memo.set(ref, value)
    return value
  }

  const referenced = (ref: string, keepText = false): CellValue => {
    if (!parseRef(ref)) return error('#REF!')
    const value = valueOf(ref)
    if (value.kind === 'empty') return number(0)
    if (value.kind === 'text' && !keepText) return error('#VALOR!')
    return value
  }

  const rangeValues = (from: string, to: string): CellValue[] | CellValue => {
    const a = parseRef(from)
    const b = parseRef(to)
    if (!a || !b) return error('#REF!')
    const values: CellValue[] = []
    for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) {
      for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
        values.push(valueOf(cellRef(col, row)))
      }
    }
    return values
  }

  const evaluate = (node: Node): CellValue => {
    switch (node.type) {
      case 'num':
        return number(node.value)
      case 'ref':
        return referenced(node.ref)
      case 'range':
        return error('#VALOR!')
      case 'neg': {
        const arg = evaluate(node.arg)
        return arg.kind === 'number' ? number(-arg.value) : arg
      }
      case 'bin': {
        const left = evaluate(node.left)
        if (left.kind !== 'number') return left
        const right = evaluate(node.right)
        if (right.kind !== 'number') return right
        if (node.op === '/' && right.value === 0) return error('#DIV/0!')
        const result = { '+': left.value + right.value, '-': left.value - right.value, '*': left.value * right.value, '/': left.value / right.value }[node.op]
        return number(result)
      }
      case 'call': {
        const fn = functionFor(node.name)
        if (!fn) return error('#NOME?')
        const numbers: number[] = []
        for (const arg of node.args) {
          // Ranges and plain references skip text and blanks, like other spreadsheets; errors propagate.
          const values = arg.type === 'range' ? rangeValues(arg.from, arg.to)
            : arg.type === 'ref' ? (parseRef(arg.ref) ? [valueOf(arg.ref)] : error('#REF!'))
              : [evaluate(arg)]
          if (!Array.isArray(values)) return values
          for (const value of values) {
            if (value.kind === 'error') return value
            if (value.kind === 'number') numbers.push(value.value)
          }
        }
        return fn(numbers)
      }
    }
  }

  return valueOf
}

export function formatValue(value: CellValue): string {
  switch (value.kind) {
    case 'empty':
      return ''
    case 'number':
      return value.value.toLocaleString('pt-BR', { maximumFractionDigits: 10 })
    case 'text':
      return value.value
    case 'error':
      return value.code
  }
}
