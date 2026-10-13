import { parseProject, type Project } from './serialize'

const KEY = 'iot-designer:project:v1'

export function loadStored(): Project | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseProject(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveStored(project: Project) {
  try {
    localStorage.setItem(KEY, JSON.stringify(project))
  } catch {
    // Storage can be unavailable or full; the editor still works without it.
  }
}

export function downloadProject(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = project.name.trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
  a.download = `${slug || 'proyek'}.iot.json`
  a.click()
  URL.revokeObjectURL(url)
}
