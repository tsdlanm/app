import { PROJECT_VERSION, type Project } from './serialize'

/** Temperature -> comparator (> 30) -> fan + LED, with a gauge and a chart on the raw temperature. */
export const exampleProject = (): Project => ({
  version: PROJECT_VERSION,
  name: 'Kipas otomatis',
  nodes: [
    { id: 'temp', kind: 'temp-sensor', x: 40, y: 120, props: { pattern: 'sine', min: 20, max: 40, period: 30 } },
    { id: 'cmp', kind: 'compare', x: 340, y: 120, props: { op: '>', threshold: 30 } },
    { id: 'fan', kind: 'fan', x: 640, y: 40, props: {} },
    { id: 'led', kind: 'led', x: 640, y: 230, props: { color: 'red' } },
    { id: 'gauge', kind: 'gauge', x: 340, y: 330, props: { min: 0, max: 50, unit: '°C' } },
    { id: 'chart', kind: 'chart', x: 640, y: 400, props: {} },
  ],
  edges: [
    { id: 'e1', source: 'temp', sourceHandle: 'out', target: 'cmp', targetHandle: 'a' },
    { id: 'e2', source: 'cmp', sourceHandle: 'out', target: 'fan', targetHandle: 'in' },
    { id: 'e3', source: 'cmp', sourceHandle: 'out', target: 'led', targetHandle: 'in' },
    { id: 'e4', source: 'temp', sourceHandle: 'out', target: 'gauge', targetHandle: 'in' },
    { id: 'e5', source: 'temp', sourceHandle: 'out', target: 'chart', targetHandle: 'in' },
  ],
})
