import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import type { PartKind } from '../types/circuit'
import {
  parseCapacitance,
  parseInductance,
  parseResistance,
  parseVoltage,
} from './formulas'

export type NetId = string

export interface ComponentBranch {
  componentId: string
  kind: PartKind
  netA: NetId
  netB: NetId
  resistance?: number
  capacitance?: number
  inductance?: number
  voltage?: number
}

export interface CircuitGraph {
  nets: Map<NetId, { handleKeys: string[] }>
  branches: ComponentBranch[]
  groundNets: Set<NetId>
}

function handleKey(nodeId: string, handleId: string): string {
  return `${nodeId}:${handleId}`
}

/** Union-find merge of handles connected by edges (and both terminals of each node). */
export function buildCircuitGraph(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
): CircuitGraph {
  const parent = new Map<string, string>()

  function find(k: string): string {
    let p = parent.get(k)
    if (!p) {
      parent.set(k, k)
      return k
    }
    if (p !== k) {
      p = find(p)
      parent.set(k, p)
    }
    return p
  }

  function union(a: string, b: string): void {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(rb, ra)
  }

  for (const n of nodes) {
    const kind = n.data.kind as PartKind
    if (kind === 'ground') {
      parent.set(handleKey(n.id, 'gnd'), handleKey(n.id, 'gnd'))
    } else if (kind === 'voltage_source') {
      parent.set(handleKey(n.id, 'neg'), handleKey(n.id, 'neg'))
      parent.set(handleKey(n.id, 'pos'), handleKey(n.id, 'pos'))
    } else {
      parent.set(handleKey(n.id, 'in'), handleKey(n.id, 'in'))
      parent.set(handleKey(n.id, 'out'), handleKey(n.id, 'out'))
    }
  }

  for (const e of edges) {
    if (!e.sourceHandle || !e.targetHandle) continue
    union(
      handleKey(e.source, e.sourceHandle),
      handleKey(e.target, e.targetHandle),
    )
  }

  const netMembers = new Map<string, string[]>()
  for (const k of parent.keys()) {
    const root = find(k)
    const list = netMembers.get(root) ?? []
    list.push(k)
    netMembers.set(root, list)
  }

  const nets = new Map<NetId, { handleKeys: string[] }>()
  for (const [netId, handleKeys] of netMembers) {
    nets.set(netId, { handleKeys })
  }

  const groundNets = new Set<NetId>()
  const branches: ComponentBranch[] = []

  for (const n of nodes) {
    const kind = n.data.kind as PartKind
    const d = n.data

    if (kind === 'ground') {
      const net = find(handleKey(n.id, 'gnd'))
      groundNets.add(net)
      continue
    }

    const netIn = find(handleKey(n.id, kind === 'voltage_source' ? 'neg' : 'in'))
    const netOut = find(
      handleKey(n.id, kind === 'voltage_source' ? 'pos' : 'out'),
    )

    const branch: ComponentBranch = {
      componentId: n.id,
      kind,
      netA: netIn,
      netB: netOut,
    }

    if (kind === 'resistor') {
      branch.resistance = parseResistance(d.value) ?? undefined
    } else if (kind === 'capacitor') {
      branch.capacitance = parseCapacitance(d.value) ?? undefined
    } else if (kind === 'inductor') {
      branch.inductance = parseInductance(d.value) ?? undefined
    } else if (kind === 'voltage_source') {
      branch.voltage = parseVoltage(d.value) ?? undefined
    }

    if (kind !== 'placeholder') {
      branches.push(branch)
    }
  }

  return { nets, branches, groundNets }
}

export function nodeIdsInNets(graph: CircuitGraph, netId: NetId): string[] {
  const handles = graph.nets.get(netId)?.handleKeys ?? []
  const ids = new Set<string>()
  for (const h of handles) {
    ids.add(h.split(':')[0] ?? h)
  }
  return [...ids]
}

export function netForNodeHandle(
  graph: CircuitGraph,
  nodes: Node<PlaceholderNodeData>[],
  _edges: Edge[],
  nodeId: string,
  prefer: 'in' | 'out' = 'out',
): NetId | null {
  const n = nodes.find((x) => x.id === nodeId)
  if (!n) return null
  const kind = n.data.kind as PartKind
  let handle = prefer === 'in' ? 'in' : 'out'
  if (kind === 'voltage_source') handle = prefer === 'in' ? 'neg' : 'pos'
  if (kind === 'ground') handle = 'gnd'
  const key = handleKey(nodeId, handle)
  for (const [netId, { handleKeys }] of graph.nets) {
    if (handleKeys.includes(key)) return netId
  }
  return null
}