import type { WindowBounds } from './types'

export const MIN_WINDOW_WIDTH = 280
export const MIN_WINDOW_HEIGHT = 180
/** Horizontal pixels of a window that must stay on screen, so its title bar can always be grabbed. */
export const VISIBLE_GRIP = 80
export const TITLEBAR_HEIGHT = 36

export interface Area {
  width: number
  height: number
}

/** Default placement for a new window: a diagonal cascade that restarts every six windows. */
export function cascadeBounds(index: number): WindowBounds {
  const offset = (index % 6) * 28
  return { x: 60 + offset, y: 40 + offset, width: 520, height: 360 }
}

export function moveBounds(origin: WindowBounds, dx: number, dy: number): WindowBounds {
  return { ...origin, x: origin.x + dx, y: origin.y + dy }
}

export function resizeBounds(origin: WindowBounds, dx: number, dy: number): WindowBounds {
  return {
    ...origin,
    width: Math.max(MIN_WINDOW_WIDTH, origin.width + dx),
    height: Math.max(MIN_WINDOW_HEIGHT, origin.height + dy),
  }
}

/** Applied when a gesture ends: enforces the minimum size, fits the window to the area, and keeps its title bar reachable. */
export function clampBounds(bounds: WindowBounds, area: Area): WindowBounds {
  const width = clamp(bounds.width, MIN_WINDOW_WIDTH, area.width)
  const height = clamp(bounds.height, MIN_WINDOW_HEIGHT, area.height)
  return {
    x: clamp(bounds.x, VISIBLE_GRIP - width, area.width - VISIBLE_GRIP),
    y: clamp(bounds.y, 0, area.height - TITLEBAR_HEIGHT),
    width,
    height,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}
