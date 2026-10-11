import { useRef } from 'react'
import { SPEEDS, useSim } from '../sim/runner'
import { exampleProject } from './example'
import { parseProject, toProject } from './serialize'
import { downloadProject } from './storage'
import { useEditor } from './store'

export default function Toolbar() {
  const name = useEditor((s) => s.name)
  const setName = useEditor((s) => s.setName)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const load = useEditor((s) => s.load)
  const clear = useEditor((s) => s.clear)
  const { status, speed, time, start, pause, reset, setSpeed } = useSim()
  const fileRef = useRef<HTMLInputElement>(null)

  const replaceProject = (p: Parameters<typeof load>[0]) => {
    reset()
    load(p)
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const project = parseProject(JSON.parse(await file.text()))
      if (!project) throw new Error('invalid')
      replaceProject(project)
    } catch {
      alert('File tidak valid. Pilih file .iot.json yang diekspor dari aplikasi ini.')
    }
  }

  return (
    <header className="toolbar">
      <input
        className="name"
        aria-label="Nama proyek"
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="group">
        <button type="button" className="btn" onClick={undo} disabled={!canUndo} title="Urungkan (Ctrl+Z)">↶ Undo</button>
        <button type="button" className="btn" onClick={redo} disabled={!canRedo} title="Ulangi (Ctrl+Shift+Z)">↷ Redo</button>
      </div>

      <div className="group">
        {status === 'running' ? (
          <button type="button" className="btn" onClick={pause}>⏸ Pause</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start}>▶ {status === 'paused' ? 'Lanjut' : 'Run'}</button>
        )}
        <button type="button" className="btn" onClick={reset} disabled={status === 'stopped'}>⏹ Reset</button>
        <label className="speed">
          Kecepatan
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
        <span className={`status status-${status}`} role="status">
          {status === 'running' ? 'Berjalan' : status === 'paused' ? 'Dijeda' : 'Berhenti'} · {(time / 1000).toFixed(1)} s
        </span>
      </div>

      <div className="group group-end">
        <button type="button" className="btn" onClick={() => replaceProject(exampleProject())}>Contoh</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (confirm('Kosongkan kanvas?')) {
              reset()
              clear()
            }
          }}
        >
          Kosongkan
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const { name: n, nodes, edges } = useEditor.getState()
            downloadProject(toProject(n, nodes, edges))
          }}
        >
          Ekspor
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Impor</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void onImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    </header>
  )
}
