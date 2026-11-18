import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'

export type AppMode = 'design' | 'build' | 'troubleshoot' | 'measure'

export interface ProbePoint {
  nodeId: string
}

export interface MeasureState {
  probeA: ProbePoint | null
  probeB: ProbePoint | null
}

export function defaultMeasureState(): MeasureState {
  return { probeA: null, probeB: null }
}

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface ModeProgress {
  checks: Record<string, boolean>
  notes: string
}

export const DEFAULT_BUILD_CHECKS: Record<string, string> = {
  components: 'All components placed',
  power: 'Power nets connected',
  ground: 'Ground reference complete',
}

export const DEFAULT_TROUBLESHOOT_CHECKS: Record<string, string> = {
  continuity: 'Continuity between key nodes',
  supply: 'Supply voltage in spec',
  joints: 'Connections visually verified',
}

export function emptyModeProgress(
  keys: Record<string, string>,
): ModeProgress {
  const checks: Record<string, boolean> = {}
  for (const key of Object.keys(keys)) {
    checks[key] = false
  }
  return { checks, notes: '' }
}

export interface GraphSnapshot {
  nodes: Node<PlaceholderNodeData>[]
  edges: Edge[]
  viewport: ViewportState
  nodeSeq: number
}

export interface CircuitDocument {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  graph: GraphSnapshot
  mode: AppMode
  buildProgress: ModeProgress
  troubleshootProgress: ModeProgress
  measureState?: MeasureState
}

export interface SessionState {
  documentId: string | null
  documentName: string | null
  graph: GraphSnapshot
  mode: AppMode
  buildProgress: ModeProgress
  troubleshootProgress: ModeProgress
  measureState: MeasureState
  savedFingerprint: string | null
  updatedAt: string
}

export const SESSION_KEY = 'last-session'

export function defaultGraph(): GraphSnapshot {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    nodeSeq: 0,
  }
}

export function defaultSession(): SessionState {
  return {
    documentId: null,
    documentName: null,
    graph: defaultGraph(),
    mode: 'design',
    buildProgress: emptyModeProgress(DEFAULT_BUILD_CHECKS),
    troubleshootProgress: emptyModeProgress(DEFAULT_TROUBLESHOOT_CHECKS),
    measureState: defaultMeasureState(),
    savedFingerprint: null,
    updatedAt: new Date().toISOString(),
  }
}