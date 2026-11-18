import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import { connectedHandlesForNode, expectedHandles } from './connectedHandles'

export interface OpenTerminal {
  nodeId: string
  handleId: string
  label: string
}

/** Terminals with no wire — same rules as build-mode open-handle highlights. */
export function findOpenTerminals(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
): OpenTerminal[] {
  const open: OpenTerminal[] = []
  for (const n of nodes) {
    const kind = n.data.kind
    if (kind === 'placeholder') continue
    const expected = expectedHandles(kind)
    const connected = connectedHandlesForNode(n.id, edges)
    const partLabel = (n.data.label ?? n.id).trim()
    for (const handleId of expected) {
      if (!connected.includes(handleId)) {
        open.push({
          nodeId: n.id,
          handleId,
          label: `${partLabel} (${handleId})`,
        })
      }
    }
  }
  return open.sort((a, b) => a.label.localeCompare(b.label))
}