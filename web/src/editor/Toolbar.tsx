import { useRef } from 'react'
import { SPEEDS, useSim } from '../sim/runner'
import Icon from '../ui/Icon'
import { toast } from '../ui/toast'
import { EXAMPLES } from './example'
import { parseProject, toProject, type Project } from './serialize'
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

  const replaceProject = (p: Project) => {
    reset()
    load(p)
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const project = parseProject(JSON.parse(await file.text()))
      if (!project) throw new Error('invalid')
      replaceProject(project)
      toast.info(`Proyek "${project.name}" dimuat`)
    } catch {
      toast.error('File tidak valid. Pilih file .iot.json yang diekspor dari aplikasi ini.')
    }
  }

  const label = status === 'running' ? 'Berjalan' : status === 'paused' ? 'Dijeda' : 'Berhenti'

  return (
    <header className="toolbar">
      <div className="brand" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="currentColor" />
          <g fill="#fff">
            <circle cx="9" cy="16" r="3" />
            <circle cx="23" cy="9" r="3" />
            <circle cx="23" cy="23" r="3" />
          </g>
          <path d="M12 16h4l4-7M16 16l4 7" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <input className="name" aria-label="Nama proyek" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />

      <div className="group" role="group" aria-label="Riwayat">
        <button type="button" className="btn btn-icon" onClick={undo} disabled={!canUndo} title="Urungkan (Ctrl+Z)" aria-label="Urungkan">
          <Icon name="undo" />
        </button>
        <button type="button" className="btn btn-icon" onClick={redo} disabled={!canRedo} title="Ulangi (Ctrl+Shift+Z)" aria-label="Ulangi">
          <Icon name="redo" />
        </button>
      </div>

      <div className="group" role="group" aria-label="Simulasi">
        {status === 'running' ? (
          <button type="button" className="btn" onClick={pause}>
            <Icon name="pause" /> Pause
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start}>
            <Icon name="play" /> {status === 'paused' ? 'Lanjut' : 'Run'}
          </button>
        )}
        <button type="button" className="btn" onClick={reset} disabled={status === 'stopped'}>
          <Icon name="stop" /> Reset
        </button>
        <label className="speed">
          Kecepatan
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <span className={`status status-${status}`} role="status">
          <i aria-hidden="true" /> {label} · {(time / 1000).toFixed(1)} s
        </span>
      </div>

      <div className="group group-end" role="group" aria-label="Proyek">
        <label className="btn select-btn" title="Muat contoh rangkaian">
          <Icon name="book" />
          <select
            aria-label="Muat contoh"
            value=""
            onChange={(e) => {
              const example = EXAMPLES.find((x) => x.id === e.target.value)
              if (example) replaceProject(example.build())
            }}
          >
            <option value="" disabled>
              Contoh
            </option>
            {EXAMPLES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          title="Kosongkan kanvas"
          onClick={() => {
            reset()
            clear()
            toast.info('Kanvas dikosongkan', { label: 'Urungkan', run: useEditor.getState().undo })
          }}
        >
          <Icon name="trash" /> Kosongkan
        </button>
        <button
          type="button"
          className="btn"
          title="Unduh proyek sebagai file"
          onClick={() => {
            const { name: n, nodes, edges } = useEditor.getState()
            downloadProject(toProject(n, nodes, edges))
          }}
        >
          <Icon name="download" /> Ekspor
        </button>
        <button type="button" className="btn" title="Buka file proyek" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" /> Impor
        </button>
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
