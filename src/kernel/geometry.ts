import type { WindowGeometry } from './types'

export const MIN_WINDOW_WIDTH = 240
export const MIN_WINDOW_HEIGHT = 160

export interface Area {
  width: number
  height: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Drag: moves the window by a pointer delta and keeps it fully inside the desktop area. */
export function moveGeometry(origin: WindowGeometry, dx: number, dy: number, area: Area): WindowGeometry {
  return {
    ...origin,
    x: clamp(origin.x + dx, 0, area.width - origin.width),
    y: clamp(origin.y + dy, 0, area.height - origin.height),
  }
}

/** Resize from the bottom-right corner: respects the minimum size, and never extends past the desktop area. */
export function resizeGeometry(origin: WindowGeometry, dx: number, dy: number, area: Area): WindowGeometry {
  const maxWidth = Math.max(1, area.width - origin.x)
  const maxHeight = Math.max(1, area.height - origin.y)
  return {
    ...origin,
    width: clamp(origin.width + dx, Math.min(MIN_WINDOW_WIDTH, maxWidth), maxWidth),
    height: clamp(origin.height + dy, Math.min(MIN_WINDOW_HEIGHT, maxHeight), maxHeight),
  }
}
