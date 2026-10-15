export type AppId = 'notes' | 'browser' | 'sheets' | 'writer'

export type PanelId = 'ai' | 'tools' | 'files'

export interface WindowGeometry {
  x: number
  y: number
  width: number
  height: number
}

export interface AppWindow {
  id: string
  appId: AppId
  title: string
  minimized: boolean
  zIndex: number
  geometry?: WindowGeometry
}

/** "Templo de Trabalho": a task/project-oriented space that replaces traditional tabs. */
export interface Temple {
  id: string
  name: string
  glyph: string
  windows: AppWindow[]
}

export interface ShellState {
  temples: Temple[]
  activeTempleId: string
  openPanel: PanelId | null
  nextZ: number
  nextId: number
}

export type ShellAction =
  | { type: 'temple/create'; name: string; glyph?: string }
  | { type: 'temple/activate'; templeId: string }
  | { type: 'window/open'; appId: AppId; title: string }
  | { type: 'window/close'; windowId: string }
  | { type: 'window/focus'; windowId: string }
  | { type: 'window/toggleMinimize'; windowId: string }
  | { type: 'window/setGeometry'; windowId: string; geometry: WindowGeometry }
  | { type: 'panel/toggle'; panel: PanelId }
