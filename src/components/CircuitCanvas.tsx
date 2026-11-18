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
  type OnSelectionChangeParams,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef } from 'react'
import { PALETTE_DRAG_TYPE } from '../types/circuit'
import type { AppMode, ProbePoint } from '../store/types'
import type { ViewportState } from '../store/types'
import { getNodeSeq, nextNodeId, syncNodeSeqFromNodes } from '../utils/nodeIds'
import {
  CircuitPartNode,
  type PlaceholderNodeData,
} from './nodes/CircuitPartNode'
import type { PaletteItem } from './ComponentPalette'

const nodeTypes = { placeholder: CircuitPartNode, circuitPart: CircuitPartNode }

function itemToNode(
  item: PaletteItem,
  position: { x: number; y: number },
): Node<PlaceholderNodeData> {
  return {
    id: nextNodeId(),
    type: 'circuitPart',
    position,
    data: {
      kind: item.kind,
      label: item.label,
      value: item.defaultValue,
    },
  }
}

type CircuitCanvasInnerProps = {
  appMode: AppMode
  initialNodes: Node<PlaceholderNodeData>[]
  initialEdges: Edge[]
  viewport: ViewportState
  probeA: ProbePoint | null
  probeB: ProbePoint | null
  onGraphChange: (graph: {
    nodes: Node<PlaceholderNodeData>[]
    edges: Edge[]
    viewport: ViewportState
    nodeSeq: number
  }) => void
  onRegisterAdd: (fn: (item: PaletteItem) => void) => void
  onSelectionChange: (ids: string[]) => void
  onProbePick: (nodeId: string) => void
}

function CircuitCanvasInner({
  appMode,
  initialNodes,
  initialEdges,
  viewport,
  probeA,
  probeB,
  onGraphChange,
  onRegisterAdd,
  onSelectionChange,
  onProbePick,
}: CircuitCanvasInnerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PlaceholderNodeData>>(
    initialNodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const { screenToFlowPosition, setViewport } = useReactFlow()
  const viewportRef = useRef(viewport)

  useEffect(() => {
    syncNodeSeqFromNodes(initialNodes)
    setViewport(viewport)
    viewportRef.current = viewport
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitGraph = useCallback(
    (
      nextNodes: Node<PlaceholderNodeData>[],
      nextEdges: Edge[],
      nextViewport: ViewportState,
    ) => {
      onGraphChange({
        nodes: nextNodes,
        edges: nextEdges,
        viewport: nextViewport,
        nodeSeq: getNodeSeq(),
      })
    },
    [onGraphChange],
  )

  useEffect(() => {
    emitGraph(nodes, edges, viewportRef.current)
  }, [nodes, edges, emitGraph])

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          probeMark:
            probeA?.nodeId === n.id
              ? 'A'
              : probeB?.nodeId === n.id
                ? 'B'
                : undefined,
        },
      })),
    )
  }, [probeA, probeB, setNodes])

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

  const onMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, vp: Viewport) => {
      viewportRef.current = { x: vp.x, y: vp.y, zoom: vp.zoom }
      emitGraph(nodes, edges, viewportRef.current)
    },
    [emitGraph, nodes, edges],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (appMode !== 'measure') return
      onProbePick(node.id)
    },
    [appMode, onProbePick],
  )

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const ids = (params.nodes ?? []).map((n) => n.id)
      onSelectionChange(ids)
    },
    [onSelectionChange],
  )

  return (
    <div
      ref={wrapperRef}
      className={`canvas${appMode === 'measure' ? ' canvas--measure' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onNodeClick={onNodeClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        snapToGrid
        snapGrid={[16, 16]}
        connectionLineStyle={{ stroke: '#5b9fd4', strokeWidth: 2 }}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={appMode === 'measure'}
        panOnDrag={appMode !== 'measure'}
      >
        <Background gap={16} color="#2a3544" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#3d4f63"
          maskColor="rgb(15 20 25 / 0.75)"
          className="canvas__minimap"
        />
      </ReactFlow>
      {appMode === 'measure' ? (
        <p className="canvas__measure-hint">
          Drag to region-select · Click nodes for probes A then B
        </p>
      ) : null}
      {nodes.length === 0 ? (
        <p className="canvas__empty">
          Drop a resistor here or use the palette to start wiring.
        </p>
      ) : null}
    </div>
  )
}

export type CircuitCanvasProps = CircuitCanvasInnerProps & {
  graphKey: string
}

export function CircuitCanvas({ graphKey, ...props }: CircuitCanvasProps) {
  return (
    <ReactFlowProvider key={graphKey}>
      <CircuitCanvasInner {...props} />
    </ReactFlowProvider>
  )
}