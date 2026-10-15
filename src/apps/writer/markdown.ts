/**
 * Markdown subset for Escriba, parsed into a tree that React renders as elements.
 * No HTML from the document ever reaches the DOM, so the preview is safe by construction.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; content: Inline[] }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; content: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'rule' }

/** Only these schemes become links; anything else (javascript:, data:, relative paths) stays text. */
export function safeHref(url: string): string | null {
  return /^(https?:\/\/|mailto:)/i.test(url.trim()) ? url.trim() : null
}

const INLINE = /`([^`]+)`|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|(?<![\p{L}\p{N}])_([^_\s][^_]*?)_(?![\p{L}\p{N}])|\[([^\]]+)\]\(([^)\s]+)\)/gu

export function parseInline(source: string): Inline[] {
  const nodes: Inline[] = []
  let last = 0
  const text = (value: string) => {
    if (!value) return
    const previous = nodes[nodes.length - 1]
    if (previous?.type === 'text') previous.text += value
    else nodes.push({ type: 'text', text: value })
  }
  for (const match of source.matchAll(INLINE)) {
    const [whole, code, strong, star, underscore, label, url] = match
    text(source.slice(last, match.index))
    last = match.index + whole.length
    if (code !== undefined) nodes.push({ type: 'code', text: code })
    else if (strong !== undefined) nodes.push({ type: 'strong', children: parseInline(strong) })
    else if (star !== undefined || underscore !== undefined) nodes.push({ type: 'em', children: parseInline(star ?? underscore) })
    else {
      const href = safeHref(url)
      if (href) nodes.push({ type: 'link', href, children: parseInline(label) })
      else text(whole)
    }
  }
  text(source.slice(last))
  return nodes
}

const HEADING = /^(#{1,6})\s+(.*)$/
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const FENCE = /^\s*```/

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0
  const startsBlock = (line: string) =>
    line.trim() === '' || HEADING.test(line) || RULE.test(line) || BULLET.test(line) ||
    NUMBERED.test(line) || QUOTE.test(line) || FENCE.test(line)

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      index++
    } else if (FENCE.test(line)) {
      const code: string[] = []
      index++
      while (index < lines.length && !FENCE.test(lines[index])) code.push(lines[index++])
      index++ // closing fence (or end of document)
      blocks.push({ type: 'code', text: code.join('\n') })
    } else if (HEADING.test(line)) {
      const [, hashes, content] = HEADING.exec(line)!
      blocks.push({ type: 'heading', level: hashes.length as 1 | 2 | 3 | 4 | 5 | 6, content: parseInline(content.trim()) })
      index++
    } else if (RULE.test(line)) {
      blocks.push({ type: 'rule' })
      index++
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = !BULLET.test(line)
      const pattern = ordered ? NUMBERED : BULLET
      const items: Inline[][] = []
      while (index < lines.length && pattern.test(lines[index]) && !RULE.test(lines[index])) {
        items.push(parseInline(pattern.exec(lines[index])![1].trim()))
        index++
      }
      blocks.push({ type: 'list', ordered, items })
    } else if (QUOTE.test(line)) {
      const quoted: string[] = []
      while (index < lines.length && QUOTE.test(lines[index])) quoted.push(QUOTE.exec(lines[index++])![1].trim())
      blocks.push({ type: 'quote', content: parseInline(quoted.join(' ')) })
    } else {
      const paragraph: string[] = []
      while (index < lines.length && (paragraph.length === 0 || !startsBlock(lines[index]))) paragraph.push(lines[index++].trim())
      blocks.push({ type: 'paragraph', content: parseInline(paragraph.join(' ')) })
    }
  }
  return blocks
}

export function countWords(source: string): number {
  return source.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
}
