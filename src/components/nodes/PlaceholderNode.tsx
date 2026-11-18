import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { PartAttributes } from '../../types/circuit'

export type PlaceholderNodeData = PartAttributes & {
  kind: string
  [key: string]: unknown
}

export function PlaceholderNode({ data, selected }: NodeProps) {
  const d = data as unknown as PlaceholderNodeData
  return (
    <div className={`circuit-node${selected ? ' circuit-node--selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <div className="circuit-node__symbol">R</div>
      <p className="circuit-node__label">{d.label ?? 'Resistor'}</p>
      {d.value ? (
        <p className="circuit-node__value">{d.value}</p>
      ) : null}
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}