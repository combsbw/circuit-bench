import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef } from 'react'
import { PALETTE_DRAG_TYPE } from '../types/circuit'
import {
  PlaceholderNode,
  type PlaceholderNodeData,
} from './nodes/PlaceholderNode'
import type { PaletteItem } from './ComponentPalette'

const nodeTypes = { placeholder: PlaceholderNode }

let nodeSeq = 0

function nextNodeId() {
  nodeSeq += 1
  return `part-${nodeSeq}`
}

function itemToNode(
  item: PaletteItem,
  position: { x: number; y: number },
): Node<PlaceholderNodeData> {
  return {
    id: nextNodeId(),
    type: 'placeholder',
    position,
    data: {
      kind: item.kind,
      label: item.label,
      value: item.defaultValue,
    },
  }
}

type CircuitCanvasInnerProps = {
  onRegisterAdd: (fn: (item: PaletteItem) => void) => void
}

function CircuitCanvasInner({ onRegisterAdd }: CircuitCanvasInnerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PlaceholderNodeData>>(
    [],
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    onRegisterAdd((item) => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      setNodes((nds) => nds.concat(itemToNode(item, position)))
    })
  }, [onRegisterAdd, screenToFlowPosition, setNodes])

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds))
    },
    [setEdges],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(PALETTE_DRAG_TYPE)
      if (!raw) return
      const item = JSON.parse(raw) as PaletteItem
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setNodes((nds) => nds.concat(itemToNode(item, position)))
    },
    [screenToFlowPosition, setNodes],
  )

  return (
    <div
      ref={wrapperRef}
      className="canvas"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        connectionLineStyle={{ stroke: '#5b9fd4', strokeWidth: 2 }}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="#2a3544" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#3d4f63"
          maskColor="rgb(15 20 25 / 0.75)"
          className="canvas__minimap"
        />
      </ReactFlow>
      {nodes.length === 0 ? (
        <p className="canvas__empty">
          Drop a resistor here or use the palette to start wiring.
        </p>
      ) : null}
    </div>
  )
}

type CircuitCanvasProps = {
  onRegisterAdd: (fn: (item: PaletteItem) => void) => void
}

export function CircuitCanvas({ onRegisterAdd }: CircuitCanvasProps) {
  return (
    <ReactFlowProvider>
      <CircuitCanvasInner onRegisterAdd={onRegisterAdd} />
    </ReactFlowProvider>
  )
}