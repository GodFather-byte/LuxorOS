import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from './storageKeys'

const STORAGE_KEY = STORAGE_KEYS.notes

export function NotesApp() {
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text)
  }, [text])

  return (
    <textarea
      className="notes-app"
      aria-label="Notas"
      placeholder="Escreva no papiro…"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  )
}
