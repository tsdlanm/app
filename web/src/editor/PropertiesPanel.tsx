import { lazy, Suspense, useMemo } from 'react'
import { getDef, MCU_PROGRAM_LIMIT, pinSpec } from '../components/registry'
import type { ComponentDef, PropDef } from '../components/types'
import { compile } from '../sim/firmware'
import ComponentIcon from '../ui/ComponentIcon'
import Icon from '../ui/Icon'
import { useEditor } from './store'

// The editor (CodeMirror) is only needed once a board is selected, so it loads on demand.
const CodeEditor = lazy(() => import('./CodeEditor'))

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
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
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
      {groups.map((g) => (
        <div key={g.role}>
          <h3>
            <span className={`legend ${g.cls}`} aria-hidden="true" /> {g.title}
          </h3>
          <p className="chips">
            {def.board!.pins
              .filter((p) => p.role === g.role)
              .map((p) => (
                <code key={p.id}>{p.id}</code>
              ))}
          </p>
        </div>
      ))}
    </div>
  )
}

function ProgramEditor({ id, def, value }: { id: string; def: ComponentDef; value: string }) {
  const updateProp = useEditor((s) => s.updateProp)
  const pins = useMemo(() => pinSpec(def.board!), [def])
  const result = useMemo(() => compile(value, pins), [value, pins])
  const shown = result.errors.slice(0, 3)

  return (
    <div className="program">
      <div className="program-head">
        <span>Program</span>
        <span className="muted">
          {value.length}/{MCU_PROGRAM_LIMIT}
        </span>
      </div>
      <Suspense fallback={<pre className="code-fallback">{value}</pre>}>
        <CodeEditor key={id} value={value} pins={pins} maxLength={MCU_PROGRAM_LIMIT} label="Program papan" onChange={(v) => updateProp(id, 'program', v)} />
      </Suspense>
      {result.errors.length > 0 ? (
        <ul className="errors" role="alert">
          {shown.map((e) => (
            <li key={`${e.line}-${e.message}`}>
              <Icon name="alert" size={13} />
              <span>
                <strong>Baris {e.line}</strong> · {e.message}
              </span>
            </li>
          ))}
          {result.errors.length > shown.length && <li className="more">dan {result.errors.length - shown.length} kesalahan lagi</li>}
        </ul>
      ) : (
        <p className="ok">
          <Icon name="check" size={13} /> Valid · {result.statements.length} perintah
        </p>
      )}
      <details className="help">
        <summary>Cara menulis program</summary>
        <p>
          Satu perintah per baris: <code>PIN = ekspresi</code>. Teks setelah <code>#</code> adalah catatan.
        </p>
        <ul>
          <li>Hanya pin keluaran yang bisa diisi.</li>
          <li>Pin masukan yang belum disambung terbaca 0 atau salah.</li>
          <li>
            <code>time</code> adalah waktu simulasi dalam detik.
          </li>
          <li>
            Operator: <code>+ - * / %</code>, <code>&gt; &gt;= &lt; &lt;= == !=</code>, <code>and or not</code>, dan kurung.
          </li>
          <li>Baris di bawah boleh membaca keluaran yang diisi baris di atasnya.</li>
          <li>
            Tekan <kbd>Ctrl</kbd> + <kbd>Space</kbd> untuk saran nama pin.
          </li>
        </ul>
      </details>
    </div>
  )
}

function Shortcuts() {
  return (
    <dl className="shortcuts">
      <dt>Pilih beberapa</dt>
      <dd>seret area kosong</dd>
      <dt>Geser kanvas</dt>
      <dd>
        <kbd>Space</kbd> + seret
      </dd>
      <dt>Zoom</dt>
      <dd>roda mouse</dd>
      <dt>Alat pilih / tangan</dt>
      <dd>
        <kbd>V</kbd> / <kbd>H</kbd>
      </dd>
      <dt>Hapus</dt>
      <dd>
        <kbd>Del</kbd>
      </dd>
      <dt>Duplikat</dt>
      <dd>
        <kbd>Ctrl</kbd> <kbd>D</kbd>
      </dd>
      <dt>Pilih semua</dt>
      <dd>
        <kbd>Ctrl</kbd> <kbd>A</kbd>
      </dd>
      <dt>Urungkan</dt>
      <dd>
        <kbd>Ctrl</kbd> <kbd>Z</kbd>
      </dd>
    </dl>
  )
}

export default function PropertiesPanel() {
  // Select the stable array and derive from it; filtering inside the selector would return a new array every render.
  const nodes = useEditor((s) => s.nodes)
  const selected = useMemo(() => nodes.filter((n) => n.selected), [nodes])
  const removeNode = useEditor((s) => s.removeNode)
  const removeSelected = useEditor((s) => s.removeSelected)
  const duplicateSelected = useEditor((s) => s.duplicateSelected)
  const node = selected.length === 1 ? selected[0] : undefined
  const def = node && getDef(node.data.kind)

  return (
    <div className={`props-inner ${def?.view === 'board' ? 'is-board' : ''}`}>
      {selected.length > 1 ? (
        <>
          <header className="props-head">
            <h2>{selected.length} komponen dipilih</h2>
            <p className="hint">Seret salah satunya untuk memindahkan semuanya.</p>
          </header>
          <div className="actions">
            <button type="button" className="btn" onClick={duplicateSelected}>
              <Icon name="copy" size={15} /> Duplikat
            </button>
            <button type="button" className="btn btn-danger" onClick={removeSelected}>
              <Icon name="trash" size={15} /> Hapus
            </button>
          </div>
        </>
      ) : !node || !def ? (
        <div className="props-empty">
          <p className="hint">Pilih satu komponen untuk mengubah propertinya.</p>
          <Shortcuts />
        </div>
      ) : (
        <>
          <header className={`props-head cat-${def.category}`}>
            <h2>
              <ComponentIcon kind={def.kind} size={17} className="head-icon" /> {def.label}
            </h2>
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
          <button type="button" className="btn btn-danger btn-block" onClick={() => removeNode(node.id)}>
            <Icon name="trash" size={15} /> Hapus komponen
          </button>
        </>
      )}
    </div>
  )
}
