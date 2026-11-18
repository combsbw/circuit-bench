import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { useCallback } from 'react'
import type { PartAttributes, PartKind } from '../../types/circuit'

export type PlaceholderNodeData = PartAttributes & {
  kind: PartKind
  [key: string]: unknown
}

const SYMBOL: Record<PartKind, string> = {
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  ground: '⏚',
  voltage_source: 'V',
  placeholder: '?',
}

export function CircuitPartNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as PlaceholderNodeData
  const { updateNodeData } = useReactFlow()
  const kind = d.kind ?? 'placeholder'
  const symbol = SYMBOL[kind] ?? '?'

  const onValueChange = useCallback(
    (value: string) => {
      updateNodeData(id, { value })
    },
    [id, updateNodeData],
  )

  const isProbeMark = d.probeMark === 'A' || d.probeMark === 'B'
  const probeClass =
    d.probeMark === 'A'
      ? 'circuit-node--probe-a'
      : d.probeMark === 'B'
        ? 'circuit-node--probe-b'
        : ''

  return (
    <div
      className={`circuit-node${selected ? ' circuit-node--selected' : ''}${isProbeMark ? ` ${probeClass}` : ''}`}
    >
      {kind === 'ground' ? (
        <Handle type="target" position={Position.Top} id="gnd" />
      ) : kind === 'voltage_source' ? (
        <>
          <Handle type="target" position={Position.Left} id="neg" />
          <Handle type="source" position={Position.Right} id="pos" />
        </>
      ) : (
        <>
          <Handle type="target" position={Position.Left} id="in" />
          <Handle type="source" position={Position.Right} id="out" />
        </>
      )}
      <div className="circuit-node__symbol">{symbol}</div>
      <p className="circuit-node__label">{d.label ?? kind}</p>
      {kind !== 'ground' ? (
        selected ? (
          <input
            className="circuit-node__value-input"
            value={d.value ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="value"
          />
        ) : d.value ? (
          <p className="circuit-node__value">{d.value}</p>
        ) : null
      ) : null}
      {isProbeMark ? (
        <span className="circuit-node__probe-tag">{d.probeMark}</span>
      ) : null}
    </div>
  )
}