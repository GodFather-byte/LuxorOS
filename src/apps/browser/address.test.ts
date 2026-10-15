import { describe, expect, it } from 'vitest'
import { resolveAddress } from './address'

const urlOf = (input: string) => {
  const destination = resolveAddress(input)
  return destination?.kind === 'page' ? destination.url : destination?.kind
}

describe('resolveAddress', () => {
  it('keeps http and https URLs, including path, query, and fragment', () => {
    expect(urlOf('https://example.com/a?b=1#c')).toBe('https://example.com/a?b=1#c')
    expect(urlOf('  HTTP://Example.com  ')).toBe('http://example.com/')
  })

  it('adds https to bare domains and http to local hosts', () => {
    expect(urlOf('example.com')).toBe('https://example.com/')
    expect(urlOf('pt.wikipedia.org/wiki/Luxor')).toBe('https://pt.wikipedia.org/wiki/Luxor')
    expect(urlOf('localhost:5173')).toBe('http://localhost:5173/')
    expect(urlOf('127.0.0.1:8080/docs')).toBe('http://127.0.0.1:8080/docs')
  })

  it('refuses every scheme other than http and https', () => {
    for (const input of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'about:blank', 'mailto:a@b.c']) {
      expect(resolveAddress(input)).toMatchObject({ kind: 'invalid', reason: 'O Portal só abre endereços http e https.' })
    }
    expect(resolveAddress('https://')).toMatchObject({ kind: 'invalid', reason: 'Endereço inválido.' })
  })

  it('turns free text into a search', () => {
    expect(resolveAddress('templo de karnak')).toEqual({
      kind: 'search',
      query: 'templo de karnak',
      url: 'https://duckduckgo.com/?q=templo%20de%20karnak',
    })
    expect(resolveAddress('luxor')?.kind).toBe('search')
    expect(resolveAddress('a b.com')?.kind).toBe('search')
  })

  it('ignores empty input', () => {
    expect(resolveAddress('   ')).toBeNull()
  })
})
