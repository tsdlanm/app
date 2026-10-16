import { describe, expect, it } from 'vitest'
import { clampZoom, easeZoom, flowPointAt, MAX_ZOOM, MIN_ZOOM, sliderToZoom, viewportAround, wheelZoomFactor, zoomToSlider } from './zoom'

const wheel = (deltaY: number, extra = {}) => ({ deltaY, deltaMode: 0, ctrlKey: false, ...extra })

describe('wheel zoom', () => {
  it('zooms in when scrolling up and out when scrolling down', () => {
    expect(wheelZoomFactor(wheel(-100))).toBeGreaterThan(1)
    expect(wheelZoomFactor(wheel(100))).toBeLessThan(1)
  })

  it('is more sensitive than d3 default (15% per notch)', () => {
    expect(wheelZoomFactor(wheel(-100))).toBeGreaterThan(1.2)
  })

  it('is symmetric: a notch in and a notch out cancel', () => {
    expect(wheelZoomFactor(wheel(-100)) * wheelZoomFactor(wheel(100))).toBeCloseTo(1, 10)
  })

  it('boosts a trackpad pinch and understands line-based wheels', () => {
    expect(wheelZoomFactor(wheel(-4, { ctrlKey: true }))).toBeGreaterThan(wheelZoomFactor(wheel(-4)))
    expect(wheelZoomFactor(wheel(-3, { deltaMode: 1 }))).toBeGreaterThan(1.05)
  })

  it('caps a single huge event', () => {
    expect(wheelZoomFactor(wheel(-100000))).toBeCloseTo(wheelZoomFactor(wheel(-240)), 10)
  })
})

describe('anchored zoom', () => {
  it('keeps the point under the cursor fixed', () => {
    const vp = { x: 40, y: -20, zoom: 0.8 }
    const cursor = { x: 500, y: 300 }
    const p = flowPointAt(vp, cursor.x, cursor.y)
    const next = viewportAround(p, cursor.x, cursor.y, 2)
    const after = flowPointAt(next, cursor.x, cursor.y)
    expect(after.x).toBeCloseTo(p.x, 8)
    expect(after.y).toBeCloseTo(p.y, 8)
  })
})

describe('smoothing and limits', () => {
  it('eases toward the target without overshooting and then snaps to it', () => {
    let z = 1
    for (let i = 0; i < 200; i++) {
      z = easeZoom(z, 2)
      expect(z).toBeLessThanOrEqual(2)
    }
    expect(z).toBe(2)
  })

  it('moves at the same relative speed in and out', () => {
    expect(easeZoom(1, 2) / 1).toBeCloseTo(1 / (easeZoom(1, 0.5) / 1), 8)
  })

  it('allows much wider zoom than before and clamps beyond', () => {
    expect(MIN_ZOOM).toBeLessThanOrEqual(0.1)
    expect(MAX_ZOOM).toBeGreaterThanOrEqual(3)
    expect(clampZoom(0.001)).toBe(MIN_ZOOM)
    expect(clampZoom(99)).toBe(MAX_ZOOM)
  })

  it('maps the slider both ways and covers the whole range', () => {
    expect(sliderToZoom(0)).toBe(MIN_ZOOM)
    expect(sliderToZoom(1)).toBe(MAX_ZOOM)
    for (const z of [0.1, 0.25, 0.5, 1, 2, 3]) expect(sliderToZoom(zoomToSlider(z))).toBeCloseTo(z, 8)
    expect(sliderToZoom(-5)).toBe(MIN_ZOOM)
  })
})
