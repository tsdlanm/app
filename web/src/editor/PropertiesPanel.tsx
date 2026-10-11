import { getDef } from '../components/registry'
import type { PropDef } from '../components/types'
import { useEditor } from './store'

function Field({ id, def, value }: { id: string; def: PropDef; value: number | string | boolean | undefined }) {
  const updateProp = useEditor((s) => s.updateProp)
  const inputId = `${id}-${def.key}`

  if (def.type === 'boolean') {
    return (
      <label className="field field-check" htmlFor={inputId}>
        <input id={inputId} type="checkbox" checked={value === true} onChange={(e) => updateProp(id, def.key, e.target.checked)} />
        {def.label}
      </label>
    )
  }

  if (def.type === 'select') {
    return (
      <label className="field" htmlFor={inputId}>
        {def.label}
        <select id={inputId} value={String(value ?? def.default)} onChange={(e) => updateProp(id, def.key, e.target.value)}>
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="field" htmlFor={inputId}>
      {def.label}
      <input
        id={inputId}
        type="number"
        value={typeof value === 'number' ? value : def.default}
        min={def.min}
        max={def.max}
        step={def.step}
        onChange={(e) => {
          // Ignore empty/partial input while typing; keep the last valid number.
          const n = e.target.valueAsNumber
          if (Number.isFinite(n)) updateProp(id, def.key, n)
        }}
      />
    </label>
  )
}

export default function PropertiesPanel() {
  const node = useEditor((s) => s.nodes.find((n) => n.selected))
  const removeNode = useEditor((s) => s.removeNode)
  const def = node && getDef(node.data.kind)

  return (
    <aside className="props" aria-label="Properti">
      {!node || !def ? (
        <p className="hint">Pilih satu komponen di kanvas untuk mengubah propertinya.</p>
      ) : (
        <>
          <h2>{def.icon} {def.label}</h2>
          <p className="hint">{def.description}</p>
          {def.props.length === 0 && <p className="hint">Komponen ini tidak punya pengaturan.</p>}
          {def.props.map((p) => (
            <Field key={`${node.id}-${p.key}`} id={node.id} def={p} value={node.data.props[p.key]} />
          ))}
          <button type="button" className="btn btn-danger" onClick={() => removeNode(node.id)}>Hapus komponen</button>
        </>
      )}
    </aside>
  )
}
