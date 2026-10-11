import { toProject } from './serialize'
import { saveStored } from './storage'
import { useEditor } from './store'

/** Saves the project shortly after every change. Returns an unsubscribe function. */
export function startAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const unsubscribe = useEditor.subscribe((state, prev) => {
    if (state.nodes === prev.nodes && state.edges === prev.edges && state.name === prev.name) return
    clearTimeout(timer)
    timer = setTimeout(() => saveStored(toProject(state.name, state.nodes, state.edges)), 400)
  })
  return () => {
    clearTimeout(timer)
    unsubscribe()
  }
}
