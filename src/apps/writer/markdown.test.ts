import { describe, expect, it } from 'vitest'
import { countWords, parseInline, parseMarkdown, safeHref } from './markdown'

describe('parseInline', () => {
  it('parses code, strong, emphasis, and nesting', () => {
    expect(parseInline('a `x*y*` **forte *e* fim** _ênfase_ b')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'code', text: 'x*y*' },
      { type: 'text', text: ' ' },
      { type: 'strong', children: [{ type: 'text', text: 'forte ' }, { type: 'em', children: [{ type: 'text', text: 'e' }] }, { type: 'text', text: ' fim' }] },
      { type: 'text', text: ' ' },
      { type: 'em', children: [{ type: 'text', text: 'ênfase' }] },
      { type: 'text', text: ' b' },
    ])
  })

  it('leaves arithmetic and identifiers alone', () => {
    expect(parseInline('2 * 3 * 4 e snake_case_name')).toEqual([{ type: 'text', text: '2 * 3 * 4 e snake_case_name' }])
  })

  it('links only http, https, and mailto URLs; anything else stays text', () => {
    expect(parseInline('[site](https://example.com)')).toEqual([
      { type: 'link', href: 'https://example.com', children: [{ type: 'text', text: 'site' }] },
    ])
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'JAVASCRIPT:x', '/local', 'vbscript:x']) {
      expect(parseInline(`[x](${url})`)).toEqual([{ type: 'text', text: `[x](${url})` }])
    }
    expect(safeHref('MAILTO:a@b.c')).toBe('MAILTO:a@b.c')
  })

  it('keeps raw HTML as plain text', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }])
  })
})

describe('parseMarkdown', () => {
  it('parses headings, paragraphs, lists, quotes, rules, and fenced code', () => {
    const blocks = parseMarkdown([
      '# Título',
      'linha um',
      'linha dois',
      '',
      '- a',
      '* b',
      '1. primeiro',
      '2) segundo',
      '> citação',
      '> continua',
      '---',
      '```',
      '# não é título',
      '<b>cru</b>',
      '```',
    ].join('\n'))
    expect(blocks).toEqual([
      { type: 'heading', level: 1, content: [{ type: 'text', text: 'Título' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'linha um linha dois' }] },
      { type: 'list', ordered: false, items: [[{ type: 'text', text: 'a' }], [{ type: 'text', text: 'b' }]] },
      { type: 'list', ordered: true, items: [[{ type: 'text', text: 'primeiro' }], [{ type: 'text', text: 'segundo' }]] },
      { type: 'quote', content: [{ type: 'text', text: 'citação continua' }] },
      { type: 'rule' },
      { type: 'code', text: '# não é título\n<b>cru</b>' },
    ])
  })

  it('ends a paragraph where another block starts, and handles an unclosed fence', () => {
    expect(parseMarkdown('texto\n## Seção\n```\ncódigo').map((block) => block.type)).toEqual(['paragraph', 'heading', 'code'])
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown('\r\n\r\n')).toEqual([])
  })

  it('counts words, ignoring punctuation-only tokens', () => {
    expect(countWords('  Olá, mundo — teste 2 ')).toBe(4)
    expect(countWords('')).toBe(0)
  })
})
