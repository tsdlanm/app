import { useReactFlow } from '@xyflow/react'
import { useMemo, useState } from 'react'
import BoardArt from '../components/boards/BoardArt'
import { CATEGORIES, COMPONENTS } from '../components/registry'
import type { ComponentDef } from '../components/types'
import ComponentIcon from '../ui/ComponentIcon'
import Icon from '../ui/Icon'
import { useEditor } from './store'

export const DRAG_MIME = 'application/x-iot-kind'

function matches(c: ComponentDef, q: string) {
  return `${c.label} ${c.description} ${c.kind}`.toLowerCase().includes(q)
}

export default function Palette() {
  const addNode = useEditor((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  const q = query.trim().toLowerCase()
  const groups = useMemo(
    () =>
      CATEGORIES.map((cat) => ({ ...cat, items: COMPONENTS.filter((c) => c.category === cat.id && (!q || matches(c, q))) })).filter(
        (g) => g.items.length > 0,
      ),
    [q],
  )

  // Click is the fallback for touch screens and keyboards: drop the part near the canvas centre.
  const addAtCentre = (kind: string) => {
    const canvas = document.querySelector('.react-flow')?.getBoundingClientRect()
    const jitter = (useEditor.getState().nodes.length % 6) * 24
    const centre = canvas
      ? { x: canvas.left + canvas.width / 2 + jitter, y: canvas.top + canvas.height / 2 + jitter }
      : { x: 400, y: 300 }
    addNode(kind, screenToFlowPosition(centre))
  }

  return (
    <div className="palette-inner">
      <div className="search">
        <Icon name="search" size={14} />
        <input type="search" placeholder="Cari komponen" aria-label="Cari komponen" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {groups.length === 0 && <p className="hint">Tidak ada komponen untuk "{query}".</p>}

      {groups.map((g) => {
        const open = q !== '' || !closed[g.id]
        return (
          <section key={g.id} className={`group-${g.id}`}>
            <button type="button" className="group-head" aria-expanded={open} onClick={() => setClosed((c) => ({ ...c, [g.id]: open }))}>
              <span className={`chevron ${open ? '' : 'chevron-closed'}`}>
                <Icon name="chevron" size={12} />
              </span>
              {g.label}
            </button>
            {open && (
              <ul>
                {g.items.map((c) => (
                  <li key={c.kind}>
                    <button
                      type="button"
                      className={`palette-item cat-${c.category} ${c.view === 'board' ? 'tall' : ''}`}
                      draggable
                      title={c.description}
                      data-kind={c.kind}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_MIME, c.kind)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => addAtCentre(c.kind)}
                    >
                      <span className="thumb" aria-hidden="true">
                        {c.view === 'board' ? <BoardArt kind={c.kind} /> : <ComponentIcon kind={c.kind} size={18} />}
                      </span>
                      <span className="item-text">
                        <span className="item-name">{c.label}</span>
                        {c.view === 'board' && <span className="item-sub">{c.board?.pins.length} pin</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
