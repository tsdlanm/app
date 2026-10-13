import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect } from 'react'
import { startAutosave } from '../editor/autosave'
import Canvas from '../editor/Canvas'
import Palette from '../editor/Palette'
import PropertiesPanel from '../editor/PropertiesPanel'
import { useEditor } from '../editor/store'
import Toolbar from '../editor/Toolbar'
import Toasts from '../ui/Toasts'

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
}

export default function EditorPage() {
  useEffect(() => startAutosave(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || !(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      const { undo, redo } = useEditor.getState()
      if (key === 'z' && !e.shiftKey) undo()
      else if ((key === 'z' && e.shiftKey) || key === 'y') redo()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ReactFlowProvider>
      <div className="app">
        <Toolbar />
        <Palette />
        <Canvas />
        <PropertiesPanel />
        <Toasts />
      </div>
    </ReactFlowProvider>
  )
}
