import { describe, expect, it } from 'vitest'
import { cellRef, columnLabel, createEvaluator, formatValue, parseRef, type Cells } from './engine'

const show = (cells: Cells, ref: string) => formatValue(createEvaluator(cells)(ref))

describe('references', () => {
  it('converts between positions and A1 references inside the grid', () => {
    expect(columnLabel(0)).toBe('A')
    expect(cellRef(7, 19)).toBe('H20')
    expect(parseRef('b3')).toEqual({ col: 1, row: 2 })
    for (const outside of ['I1', 'A21', 'A0', 'AA1', '1A', '']) expect(parseRef(outside)).toBeNull()
  })
})

describe('createEvaluator', () => {
  it('reads plain numbers, pt-BR decimals, and text', () => {
    const cells = { A1: '42', A2: '3,5', A3: '-1.25', A4: 'Oferendas' }
    expect(show(cells, 'A1')).toBe('42')
    expect(show(cells, 'A2')).toBe('3,5')
    expect(show(cells, 'A3')).toBe('-1,25')
    expect(show(cells, 'A4')).toBe('Oferendas')
    expect(show(cells, 'B1')).toBe('')
  })

  it('applies operator precedence, parentheses, and unary minus', () => {
    const value = (formula: string) => show({ A1: formula }, 'A1')
    expect(value('=1+2*3')).toBe('7')
    expect(value('=(1+2)*3')).toBe('9')
    expect(value('=-2*3+10/4')).toBe('-3,5')
    expect(value('= 2 - -3')).toBe('5')
  })

  it('follows references, treating blanks as zero and reporting text in arithmetic', () => {
    const cells = { A1: '2', A2: '=A1*10', A3: '=A2+B9', A4: 'texto', A5: '=A4+1', A6: '=A4' }
    expect(show(cells, 'A2')).toBe('20')
    expect(show(cells, 'A3')).toBe('20')
    expect(show(cells, 'A5')).toBe('#VALOR!')
    expect(show(cells, 'A6')).toBe('texto')
  })

  it('aggregates ranges with English and Portuguese names, skipping text and blanks', () => {
    const cells = { A1: '1', A2: '2', A3: 'x', B1: '3', B2: '4' }
    const value = (formula: string) => show({ ...cells, C1: formula }, 'C1')
    expect(value('=SUM(A1:B2)')).toBe('10')
    expect(value('=soma(B2:A1)')).toBe('10')
    expect(value('=MÉDIA(A1:A3)')).toBe('1,5')
    expect(value('=AVERAGE(A1, B2; 10)')).toBe('5')
    expect(value('=MÍN(A1:B2)')).toBe('1')
    expect(value('=MAX(A1:B2, 9)')).toBe('9')
    expect(value('=SUM()')).toBe('0')
    expect(value('=MEDIA(D1:D3)')).toBe('#DIV/0!')
  })

  it('reports errors with spreadsheet-style codes', () => {
    const value = (formula: string) => show({ A1: '0', B1: formula }, 'B1')
    expect(value('=1/A1')).toBe('#DIV/0!')
    expect(value('=Z9+1')).toBe('#REF!')
    expect(value('=SUM(A1:Z99)')).toBe('#REF!')
    expect(value('=FOO(1)')).toBe('#NOME?')
    expect(value('=1+')).toBe('#ERRO!')
    expect(value('=2^3')).toBe('#ERRO!')
    expect(value('=1,5')).toBe('#ERRO!')
    expect(value('=A1:A2')).toBe('#VALOR!')
  })

  it('detects direct and indirect cycles without hanging', () => {
    expect(show({ A1: '=A1' }, 'A1')).toBe('#CICLO!')
    const cells = { A1: '=B1+1', B1: '=C1', C1: '=A1', D1: '=SUM(A1:C1)', E1: '5' }
    expect(show(cells, 'A1')).toBe('#CICLO!')
    expect(show(cells, 'C1')).toBe('#CICLO!')
    expect(show(cells, 'D1')).toBe('#CICLO!')
    expect(show(cells, 'E1')).toBe('5')
  })

  it('propagates an error from a referenced cell', () => {
    const cells = { A1: '=1/0', A2: '=A1+1', A3: '=SUM(A1:A2)' }
    expect(show(cells, 'A2')).toBe('#DIV/0!')
    expect(show(cells, 'A3')).toBe('#DIV/0!')
  })
})
