import { describe, expect, it } from 'vitest'
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, moveGeometry, resizeGeometry } from './geometry'

const area = { width: 1000, height: 700 }
const origin = { x: 100, y: 50, width: 400, height: 300 }

describe('moveGeometry', () => {
  it('moves the window by the pointer delta', () => {
    expect(moveGeometry(origin, 30, -20, area)).toEqual({ ...origin, x: 130, y: 30 })
  })

  it('keeps the whole window inside the desktop area', () => {
    expect(moveGeometry(origin, -5000, -5000, area)).toEqual({ ...origin, x: 0, y: 0 })
    expect(moveGeometry(origin, 5000, 5000, area)).toEqual({ ...origin, x: area.width - origin.width, y: area.height - origin.height })
  })
})

describe('resizeGeometry', () => {
  it('grows and shrinks by the pointer delta', () => {
    expect(resizeGeometry(origin, 50, 25, area)).toEqual({ ...origin, width: 450, height: 325 })
    expect(resizeGeometry(origin, -50, -25, area)).toEqual({ ...origin, width: 350, height: 275 })
  })

  it('never goes below the minimum size', () => {
    expect(resizeGeometry(origin, -1000, -1000, area)).toEqual({
      ...origin,
      width: MIN_WINDOW_WIDTH,
      height: MIN_WINDOW_HEIGHT,
    })
  })

  it('never extends past the desktop area', () => {
    expect(resizeGeometry(origin, 5000, 5000, area)).toEqual({
      ...origin,
      width: area.width - origin.x,
      height: area.height - origin.y,
    })
  })

  it('uses the space left in the area when that is smaller than the minimum', () => {
    // Remaining space from the window origin: 200 - 100 = 100 wide, 100 - 50 = 50 tall.
    const tiny = { width: 200, height: 100 }
    expect(resizeGeometry(origin, 0, 0, tiny)).toEqual({ ...origin, width: 100, height: 50 })
  })
})
