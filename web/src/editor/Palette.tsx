import { useReactFlow } from '@xyflow/react'
import { CATEGORIES, COMPONENTS } from '../components/registry'
import { useEditor } from './store'

export const DRAG_MIME = 'application/x-iot-kind'

export default function Palette() {
  const addNode = useEditor((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()

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
    <aside className="palette" aria-label="Daftar komponen">
      <p className="hint">Seret ke kanvas, atau klik untuk menambah.</p>
      {CATEGORIES.map((cat) => (
        <section key={cat.id}>
          <h2>{cat.label}</h2>
          <ul>
            {COMPONENTS.filter((c) => c.category === cat.id).map((c) => (
              <li key={c.kind}>
                <button
                  type="button"
                  className={`palette-item cat-${c.category}`}
                  draggable
                  title={c.description}
                  data-kind={c.kind}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_MIME, c.kind)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addAtCentre(c.kind)}
                >
                  <span aria-hidden="true">{c.icon}</span> {c.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  )
}
