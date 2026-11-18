import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import type { PartKind } from '../types/circuit'

/** Terminal handle ids we expect per kind (for build-mode highlights). */
export function expectedHandles(kind: PartKind): string[] {
  switch (kind) {
    case 'ground':
      return ['gnd']
    case 'voltage_source':
      return ['neg', 'pos']
    case 'op_amp':
      return ['in+', 'in-', 'out']
    case 'npn':
      return ['base', 'collector', 'emitter']
    case 'nmos':
    case 'pmos':
      return ['gate', 'drain', 'source']
    case 'module':
    case 'regulator':
    case 'gate_driver':
      return ['in', 'out', 'gnd']
    default:
      return ['in', 'out']
  }
}

export function connectedHandlesForNode(nodeId: string, edges: Edge[]): string[] {
  const ids = new Set<string>()
  for (const e of edges) {
    if (e.source === nodeId && e.sourceHandle) ids.add(e.sourceHandle)
    if (e.target === nodeId && e.targetHandle) ids.add(e.targetHandle)
  }
  return [...ids]
}

export function annotateBuildConnections(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
  enabled: boolean,
): Node<PlaceholderNodeData>[] {
  if (!enabled) {
    return nodes.map((n) => {
      const { connectedHandles: _c, ...rest } = n.data as PlaceholderNodeData
      return { ...n, data: rest as PlaceholderNodeData }
    })
  }
  return nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      connectedHandles: connectedHandlesForNode(n.id, edges),
    },
  }))
}