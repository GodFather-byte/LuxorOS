import type { AppId } from '../kernel/types'

export interface AppManifest {
  id: AppId
  name: string
  icon: string
  description: string
}

export const appRegistry: AppManifest[] = [
  { id: 'notes', name: 'Papiro', icon: '📜', description: 'Bloco de notas' },
  { id: 'writer', name: 'Escriba', icon: '🪶', description: 'Editor de texto' },
  { id: 'sheets', name: 'Tábuas', icon: '🧮', description: 'Planilhas' },
  { id: 'browser', name: 'Portal', icon: '🌐', description: 'Navegação web' },
]

export function getApp(id: AppId): AppManifest {
  const app = appRegistry.find((a) => a.id === id)
  if (!app) throw new Error(`App desconhecido: ${id}`)
  return app
}
