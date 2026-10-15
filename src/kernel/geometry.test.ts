import { describe, expect, it } from 'vitest'
import {
  cascadeBounds,
  clampBounds,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  moveBounds,
  resizeBounds,
  TITLEBAR_HEIGHT,
  VISIBLE_GRIP,
} from './geometry'

const area = { width: 1000, height: 700 }
const bounds = { x: 100, y: 50, width: 400, height: 300 }

describe('geometry', () => {
  it('cascades new windows and restarts the cascade every six', () => {
    expect(cascadeBounds(0)).toEqual(cascadeBounds(6))
    expect(cascadeBounds(1).x).toBeGreaterThan(cascadeBounds(0).x)
    expect(cascadeBounds(1).y).toBeGreaterThan(cascadeBounds(0).y)
  })

  it('moves by a pointer delta and resizes without going below the minimum', () => {
    expect(moveBounds(bounds, 30, -20)).toEqual({ ...bounds, x: 130, y: 30 })
    expect(resizeBounds(bounds, 50, 25)).toEqual({ ...bounds, width: 450, height: 325 })
    expect(resizeBounds(bounds, -1000, -1000)).toEqual({
      ...bounds,
      width: MIN_WINDOW_WIDTH,
      height: MIN_WINDOW_HEIGHT,
    })
  })

  it('keeps the title bar reachable when a window is dragged past the edges', () => {
    expect(clampBounds({ ...bounds, x: -5000, y: -40 }, area)).toEqual({
      ...bounds,
      x: VISIBLE_GRIP - bounds.width,
      y: 0,
    })
    expect(clampBounds({ ...bounds, x: 5000, y: 5000 }, area)).toEqual({
      ...bounds,
      x: area.width - VISIBLE_GRIP,
      y: area.height - TITLEBAR_HEIGHT,
    })
  })

  it('fits oversized windows to the area and enforces the minimum size', () => {
    expect(clampBounds({ ...bounds, width: 5000, height: 5000 }, area)).toEqual({
      x: 100,
      y: 50,
      width: area.width,
      height: area.height,
    })
    expect(clampBounds({ ...bounds, width: 10, height: 10 }, area)).toEqual({
      ...bounds,
      width: MIN_WINDOW_WIDTH,
      height: MIN_WINDOW_HEIGHT,
    })
    expect(clampBounds(bounds, { width: 200, height: 100 })).toEqual({
      x: 100,
      y: 50,
      width: MIN_WINDOW_WIDTH,
      height: MIN_WINDOW_HEIGHT,
    })
  })

  it('leaves in-bounds windows untouched', () => {
    expect(clampBounds(bounds, area)).toEqual(bounds)
  })
})
