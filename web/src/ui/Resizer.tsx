import type { KeyboardEvent, PointerEvent } from 'react'
import { useLayout, WIDTH, type Side } from './layout'

/** A thin drag handle on the inner edge of a sidebar. Drag, use the arrow keys, or double-click to reset. */
export default function Resizer({ side }: { side: Side }) {
  const width = useLayout((s) => (side === 'left' ? s.leftWidth : s.rightWidth))
  const setWidth = useLayout((s) => s.setWidth)
  const resetWidth = useLayout((s) => s.resetWidth)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    document.documentElement.classList.add('resizing')

    const move = (ev: globalThis.PointerEvent) => setWidth(side, side === 'left' ? ev.clientX : window.innerWidth - ev.clientX)
    const stop = () => {
      document.documentElement.classList.remove('resizing')
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 48 : 16
    // Dragging the edge toward the canvas widens a left sidebar; toward the canvas shrinks a right one.
    const grow = side === 'left' ? 'ArrowRight' : 'ArrowLeft'
    const shrink = side === 'left' ? 'ArrowLeft' : 'ArrowRight'
    if (e.key === grow) setWidth(side, width + step)
    else if (e.key === shrink) setWidth(side, width - step)
    else if (e.key === 'Home') resetWidth(side)
    else return
    e.preventDefault()
  }

  return (
    <div
      className={`resizer resizer-${side}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={side === 'left' ? 'Ubah lebar panel komponen' : 'Ubah lebar panel properti'}
      aria-valuenow={width}
      aria-valuemin={WIDTH[side].min}
      aria-valuemax={WIDTH[side].max}
      tabIndex={0}
      title="Seret untuk mengubah lebar. Klik dua kali untuk mengembalikan."
      onPointerDown={onPointerDown}
      onDoubleClick={() => resetWidth(side)}
      onKeyDown={onKeyDown}
    />
  )
}
