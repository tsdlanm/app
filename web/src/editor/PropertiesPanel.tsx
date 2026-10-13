import { useMemo } from 'react'
import { getDef } from '../components/registry'
import type { ComponentDef, PropDef } from '../components/types'
import { compile } from '../sim/firmware'
import { pinSpec } from '../components/registry'
import Icon from '../ui/Icon'
import { useEditor } from './store'

type Value = number | string | boolean | undefined

function Field({ id, def, value }: { id: string; def: PropDef; value: Value }) {
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

  if (def.type === 'code') return null // rendered by ProgramEditor

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

function PinList({ def }: { def: ComponentDef }) {
  const groups = [
    { role: 'in-num', title: 'Masukan angka', cls: 'port-number pin-in' },
    { role: 'in-bool', title: 'Masukan ya/tidak', cls: 'port-boolean pin-in' },
    { role: 'out', title: 'Keluaran', cls: 'port-boolean pin-out' },
  ]
  return (
    <div className="pinlist">
      {groups.map((g) => {
        const pins = def.board!.pins.filter((p) => p.role === g.role)
        return (
          <div key={g.role}>
            <h3>
              <span className={`legend ${g.cls}`} aria-hidden="true" /> {g.title}
            </h3>
            <p className="chips">
              {pins.map((p) => (
                <code key={p.id}>{p.id}</code>
              ))}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function ProgramEditor({ id, def, value }: { id: string; def: ComponentDef; value: string }) {
  const updateProp = useEditor((s) => s.updateProp)
  const result = useMemo(() => compile(value, pinSpec(def.board!)), [value, def])
  const inputId = `${id}-program`

  return (
    <div className="program">
      <label className="field" htmlFor={inputId}>
        Program
        <textarea
          id={inputId}
          className="code"
          rows={11}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={value}
          maxLength={3000}
          onChange={(e) => updateProp(id, 'program', e.target.value)}
        />
      </label>
      {result.errors.length > 0 ? (
        <ul className="errors" role="alert">
          {result.errors.map((e) => (
            <li key={`${e.line}-${e.message}`}>
              <strong>Baris {e.line}:</strong> {e.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ok">Program valid · {result.statements.length} perintah</p>
      )}
      <details className="help">
        <summary>Cara menulis program</summary>
        <p>Satu perintah per baris: <code>PIN = ekspresi</code>. Teks setelah <code>#</code> adalah catatan.</p>
        <ul>
          <li>Hanya pin keluaran yang bisa diisi.</li>
          <li>Pin masukan yang belum disambung terbaca 0 atau salah.</li>
          <li><code>time</code> adalah waktu simulasi dalam detik.</li>
          <li>Operator: <code>+ - * / %</code>, <code>&gt; &gt;= &lt; &lt;= == !=</code>, <code>and or not</code>, dan kurung.</li>
          <li>Baris di bawah boleh membaca keluaran yang diisi baris di atasnya.</li>
        </ul>
        <pre>{`D13 = A0 > 30
D12 = time % 2 < 1`}</pre>
      </details>
    </div>
  )
}

export default function PropertiesPanel() {
  const node = useEditor((s) => s.nodes.find((n) => n.selected))
  const removeNode = useEditor((s) => s.removeNode)
  const def = node && getDef(node.data.kind)

  return (
    <aside className="props" aria-label="Properti">
      {!node || !def ? (
        <div className="props-empty">
          <p className="hint">Pilih satu komponen di kanvas untuk mengubah propertinya.</p>
          <dl className="shortcuts">
            <dt>Hapus</dt>
            <dd><kbd>Del</kbd></dd>
            <dt>Urungkan</dt>
            <dd><kbd>Ctrl</kbd> + <kbd>Z</kbd></dd>
            <dt>Ulangi</dt>
            <dd><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></dd>
            <dt>Geser kanvas</dt>
            <dd>seret area kosong</dd>
            <dt>Zoom</dt>
            <dd>roda mouse</dd>
          </dl>
        </div>
      ) : (
        <>
          <header className={`props-head cat-${def.category}`}>
            <h2>{def.view === 'board' ? '🔲' : def.icon} {def.label}</h2>
            <p className="hint">{def.description}</p>
          </header>
          {def.view === 'board' && <PinList def={def} />}
          {def.props.length === 0 && <p className="hint">Komponen ini tidak punya pengaturan.</p>}
          {def.props.map((p) =>
            p.type === 'code' ? (
              <ProgramEditor key={`${node.id}-${p.key}`} id={node.id} def={def} value={String(node.data.props[p.key] ?? p.default)} />
            ) : (
              <Field key={`${node.id}-${p.key}`} id={node.id} def={p} value={node.data.props[p.key]} />
            ),
          )}
          <button type="button" className="btn btn-danger" onClick={() => removeNode(node.id)}>
            <Icon name="trash" size={15} /> Hapus komponen
          </button>
        </>
      )}
    </aside>
  )
}
