/** Zoom limits. The old defaults (0.5 to 2) were too tight for wide circuits. */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 3

/** How strongly the wheel zooms. About 25% per mouse notch, finer for trackpads. */
const WHEEL_SENSITIVITY = 0.0022
/** A trackpad pinch arrives as ctrl+wheel with small deltas, so it needs a boost. */
const PINCH_BOOST = 8

export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

/** Multiplier to apply to the zoom for one wheel event. */
export function wheelZoomFactor(e: { deltaY: number; deltaMode: number; ctrlKey: boolean }): number {
  // deltaMode 0 = pixels, 1 = lines, 2 = pages
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1)
  // A single event can be huge on some devices; cap it so one flick cannot jump across the range.
  const capped = Math.max(-240, Math.min(240, px))
  return Math.exp(-capped * WHEEL_SENSITIVITY * (e.ctrlKey ? PINCH_BOOST : 1))
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

/** The point of the flow under a screen position, for a given viewport. */
export const flowPointAt = (vp: Viewport, sx: number, sy: number) => ({
  x: (sx - vp.x) / vp.zoom,
  y: (sy - vp.y) / vp.zoom,
})

/** A viewport at `zoom` that keeps the flow point `p` under the screen position (sx, sy). */
export const viewportAround = (p: { x: number; y: number }, sx: number, sy: number, zoom: number): Viewport => ({
  x: sx - p.x * zoom,
  y: sy - p.y * zoom,
  zoom,
})

/** One smoothing step in log space, so zooming in and out feel equally fast. */
export function easeZoom(current: number, target: number, alpha = 0.28): number {
  if (Math.abs(Math.log(target / current)) < 0.002) return target
  return current * Math.pow(target / current, alpha)
}

// The slider is logarithmic so 10%-100% and 100%-300% both get a sensible share of its travel.
const LOG_MIN = Math.log(MIN_ZOOM)
const LOG_MAX = Math.log(MAX_ZOOM)

export const zoomToSlider = (zoom: number) => (Math.log(clampZoom(zoom)) - LOG_MIN) / (LOG_MAX - LOG_MIN)
export function sliderToZoom(t: number): number {
  // Return the limits exactly so the ends of the slider read 10% and 300%, not 10.000000000000002%.
  if (t <= 0) return MIN_ZOOM
  if (t >= 1) return MAX_ZOOM
  return clampZoom(Math.exp(LOG_MIN + t * (LOG_MAX - LOG_MIN)))
}
