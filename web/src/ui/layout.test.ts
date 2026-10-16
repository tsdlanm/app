import { describe, expect, it } from 'vitest'
import { clampWidth, WIDTH } from './layout'

describe('clampWidth', () => {
  it('keeps a width inside the limits of its side', () => {
    expect(clampWidth('right', 10, 1600)).toBe(WIDTH.right.min)
    expect(clampWidth('right', 5000, 3000)).toBe(WIDTH.right.max)
    expect(clampWidth('left', 300, 1600)).toBe(300)
    expect(clampWidth('left', 999, 1600)).toBe(WIDTH.left.max)
  })

  it('always leaves room for the canvas on a small window', () => {
    // 1000px wide window: at most 640px for a sidebar so 360px stays for the canvas
    expect(clampWidth('right', 800, 1000)).toBe(640)
  })

  it('never goes below the minimum even on a tiny window', () => {
    expect(clampWidth('right', 800, 300)).toBe(WIDTH.right.min)
  })

  it('returns whole pixels', () => {
    expect(Number.isInteger(clampWidth('right', 400.7, 1600))).toBe(true)
  })
})
