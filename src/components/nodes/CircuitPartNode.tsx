import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { useCallback } from 'react'
import { PartSymbol } from '../../symbols/PartSymbols'
import { expectedHandles } from '../../utils/connectedHandles'
import type { PartAttributes, PartKind } from '../../types/circuit'

export type PlaceholderNodeData = PartAttributes & {
  kind: PartKind
  buildMode?: boolean
  [key: string]: unknown
}

function handleClass(
  id: string,
  data: PlaceholderNodeData,
): string | undefined {
  if (!data.buildMode) return undefined
  const connected = data.connectedHandles ?? []
  if (!expectedHandles(data.kind).includes(id)) return undefined
  return connected.includes(id)
    ? 'circuit-handle--wired'
    : 'circuit-handle--open'
}

type PortDef = { id: string; type: 'source' | 'target'; position: Position }

function portsForKind(kind: PartKind): PortDef[] {
  switch (kind) {
    case 'ground':
      return [{ id: 'gnd', type: 'target', position: Position.Top }]
    case 'voltage_source':
      return [
        { id: 'neg', type: 'target', position: Position.Left },
        { id: 'pos', type: 'source', position: Position.Right },
      ]
    case 'op_amp':
      return [
        { id: 'in+', type: 'target', position: Position.Left },
        { id: 'in-', type: 'target', position: Position.Left },
        { id: 'out', type: 'source', position: Position.Right },
      ]
    case 'npn':
      return [
        { id: 'base', type: 'target', position: Position.Left },
        { id: 'collector', type: 'source', position: Position.Top },
        { id: 'emitter', type: 'source', position: Position.Bottom },
      ]
    case 'nmos':
    case 'pmos':
      return [
        { id: 'gate', type: 'target', position: Position.Left },
        { id: 'drain', type: 'source', position: Position.Top },
        { id: 'source', type: 'source', position: Position.Bottom },
      ]
    case 'module':
    case 'regulator':
    case 'gate_driver':
      return [
        { id: 'in', type: 'target', position: Position.Left },
        { id: 'out', type: 'source', position: Position.Right },
        { id: 'gnd', type: 'target', position: Position.Bottom },
      ]
    default:
      return [
        { id: 'in', type: 'target', position: Position.Left },
        { id: 'out', type: 'source', position: Position.Right },
      ]
  }
}

export function CircuitPartNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as PlaceholderNodeData
  const { updateNodeData } = useReactFlow()
  const kind = d.kind ?? 'placeholder'
  const ports = portsForKind(kind)

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
      className={`circuit-node circuit-node--${kind}${selected ? ' circuit-node--selected' : ''}${isProbeMark ? ` ${probeClass}` : ''}`}
    >
      {ports.map((p) => (
        <Handle
          key={p.id}
          type={p.type}
          position={p.position}
          id={p.id}
          className={handleClass(p.id, d)}
          style={
            p.id === 'in-'
              ? { top: '68%' }
              : p.id === 'in+'
                ? { top: '32%' }
                : undefined
          }
        />
      ))}
      <PartSymbol kind={kind} rotation={d.rotation ?? 0} />
      <p className="circuit-node__label">{d.label ?? kind}</p>
      {d.partNumber ? (
        <p className="circuit-node__mpn">{d.partNumber}</p>
      ) : null}
      {kind !== 'ground' && kind !== 'module' && kind !== 'gate_driver' ? (
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