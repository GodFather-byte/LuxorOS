/** Address-bar input for Portal: decides between a page to frame, a web search, or a refusal. Pure. */

export type Destination =
  | { kind: 'page'; url: string }
  | { kind: 'search'; query: string; url: string }
  | { kind: 'invalid'; input: string; reason: string }

const LOCAL_HOST = /^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/\S*)?$/i
const DOMAIN = /^[^\s/:]+\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i
const SCHEME = /^[a-z][a-z0-9+.-]*:/i

function page(url: string, input: string): Destination {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname) throw new Error('missing host')
    return { kind: 'page', url: parsed.href }
  } catch {
    return { kind: 'invalid', input, reason: 'Endereço inválido.' }
  }
}

export function resolveAddress(input: string): Destination | null {
  const text = input.trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return page(text, text)
  if (LOCAL_HOST.test(text)) return page(`http://${text}`, text)
  if (SCHEME.test(text)) {
    return { kind: 'invalid', input: text, reason: 'O Portal só abre endereços http e https.' }
  }
  if (DOMAIN.test(text)) return page(`https://${text}`, text)
  return { kind: 'search', query: text, url: `https://duckduckgo.com/?q=${encodeURIComponent(text)}` }
}
