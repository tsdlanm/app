import { create } from 'zustand'

export interface Toast {
  id: number
  kind: 'info' | 'error'
  message: string
  action?: { label: string; run: () => void }
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++
    // Repeating the same message (for example a rejected wire) replaces it instead of stacking.
    set((s) => ({ toasts: [...s.toasts.filter((x) => x.message !== t.message), { ...t, id }].slice(-3) }))
    setTimeout(() => get().dismiss(id), t.kind === 'error' ? 6000 : 7000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  info: (message: string, action?: Toast['action']) => useToasts.getState().push({ kind: 'info', message, action }),
  error: (message: string) => useToasts.getState().push({ kind: 'error', message }),
}
