import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useOnSelectionChange,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef } from 'react'
import { useGraphHistory } from '../hooks/useGraphHistory'
import { PALETTE_DRAG_TYPE } from '../types/circuit'
import type { AppMode, ProbePoint } from '../store/types'
import type { ViewportState } from '../store/types'
import { connectedHandlesForNode } from '../utils/connectedHandles'
import { getNodeSeq, nextNodeId, syncNodeSeqFromNodes } from '../utils/nodeIds'
import {
  CircuitPartNode,
  type PlaceholderNodeData,
} from './nodes/CircuitPartNode'
import type { PaletteItem } from './ComponentPalette'
import type { InspectorPatch } from './InspectorDrawer'

const nodeTypes = { placeholder: CircuitPartNode, circuitPart: CircuitPartNode }

function itemToNode(
  item: PaletteItem,
  position: { x: number; y: number },
  buildMode: boolean,
): Node<PlaceholderNodeData> {
  return {
    id: nextNodeId(),
    type: 'circuitPart',
    position,
    data: {
      kind: item.kind,
      label: item.label,
      value: item.defaultValue,
      catalogId: item.catalogId,
      partNumber: item.partNumber,
      color: item.color,
      buildMode,
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
  onRegisterPatch: (fn: (nodeId: string, patch: InspectorPatch) => void) => void
  onSelectionChange: (ids: string[]) => void
  onProbePick: (nodeId: string) => void
  onWireAdded?: () => void
  onCatalogPlaced?: (catalogId: string) => void
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
  onRegisterPatch,
  onSelectionChange,
  onProbePick,
  onWireAdded,
  onCatalogPlaced,
}: CircuitCanvasInnerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PlaceholderNodeData>>(
    initialNodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const { screenToFlowPosition, setViewport, getNodes, getEdges } = useReactFlow()
  const viewportRef = useRef(viewport)
  const { commit, undo, redo, canUndo, canRedo } = useGraphHistory()
  const edgeCountRef = useRef(initialEdges.length)

  const snapshot = useCallback(
    () => ({
      nodes: structuredClone(getNodes() as Node<PlaceholderNodeData>[]),
      edges: structuredClone(getEdges()),
    }),
    [getNodes, getEdges],
  )

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
    const build = appMode === 'build'
    setNodes((nds) =>
      nds.map((n) => {
        const connected = build ? connectedHandlesForNode(n.id, edges) : undefined
        const prev = n.data.connectedHandles
        const sameHandles =
          JSON.stringify(prev ?? []) === JSON.stringify(connected ?? [])
        if (n.data.buildMode === build && sameHandles) return n
        return {
          ...n,
          data: {
            ...n.data,
            buildMode: build,
            connectedHandles: build ? connected : undefined,
          },
        }
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, appMode])

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

  const placeItem = useCallback(
    (item: PaletteItem, position: { x: number; y: number }) => {
      commit(snapshot())
      const node = itemToNode(item, position, appMode === 'build')
      setNodes((nds) => nds.concat(node))
      if (item.catalogId) onCatalogPlaced?.(item.catalogId)
    },
    [appMode, commit, onCatalogPlaced, setNodes, snapshot],
  )

  useEffect(() => {
    onRegisterAdd((item) => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      placeItem(item, position)
    })
  }, [onRegisterAdd, placeItem, screenToFlowPosition])

  useEffect(() => {
    onRegisterPatch((nodeId, patch) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      )
    })
  }, [onRegisterPatch, setNodes])

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      commit(snapshot())
      setEdges((eds) => {
        const next = addEdge({ ...connection, type: 'smoothstep' }, eds)
        if (next.length > edgeCountRef.current) onWireAdded?.()
        edgeCountRef.current = next.length
        return next
      })
    },
    [commit, onWireAdded, setEdges, snapshot],
  )

  const deleteSelection = useCallback(() => {
    if (appMode === 'measure') return
    const selectedNodes = getNodes().filter((n) => n.selected)
    const selectedEdges = getEdges().filter((e) => e.selected)
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return
    commit(snapshot())
    const removeIds = new Set(selectedNodes.map((n) => n.id))
    setNodes((nds) => nds.filter((n) => !removeIds.has(n.id)))
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !e.selected &&
          !removeIds.has(e.source) &&
          !removeIds.has(e.target),
      ),
    )
  }, [appMode, commit, getEdges, getNodes, setEdges, setNodes, snapshot])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelection()
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        const current = snapshot()
        const restored = e.shiftKey ? redo(current) : undo(current)
        if (restored) {
          setNodes(restored.nodes)
          setEdges(restored.edges)
          edgeCountRef.current = restored.edges.length
        }
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        const current = snapshot()
        const restored = redo(current)
        if (restored) {
          setNodes(restored.nodes)
          setEdges(restored.edges)
          edgeCountRef.current = restored.edges.length
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelection, redo, setEdges, setNodes, snapshot, undo])

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
      placeItem(item, position)
    },
    [placeItem, screenToFlowPosition],
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

  const onNodeDragStop = useCallback(() => {
    commit(snapshot())
  }, [commit, snapshot])

  useOnSelectionChange({
    onChange: ({ nodes: sel }) => {
      onSelectionChange(sel.map((n) => n.id))
    },
  })

  const designSelect = appMode === 'design' || appMode === 'build'

  return (
    <div
      ref={wrapperRef}
      className={`canvas${appMode === 'measure' ? ' canvas--measure' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="canvas__edit-bar" aria-live="polite">
        <span className="canvas__edit-hint">
          {designSelect
            ? 'Shift+drag to multi-select · Del removes · ⌘/Ctrl+Z undo'
            : null}
        </span>
        {designSelect ? (
          <span className="canvas__history">
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => {
                const restored = undo(snapshot())
                if (restored) {
                  setNodes(restored.nodes)
                  setEdges(restored.edges)
                }
              }}
            >
              Undo
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={() => {
                const restored = redo(snapshot())
                if (restored) {
                  setNodes(restored.nodes)
                  setEdges(restored.edges)
                }
              }}
            >
              Redo
            </button>
          </span>
        ) : null}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        snapToGrid
        snapGrid={[16, 16]}
        connectionLineStyle={{ stroke: '#5b9fd4', strokeWidth: 2 }}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={appMode === 'measure'}
        selectionKeyCode={appMode === 'measure' ? null : 'Shift'}
        multiSelectionKeyCode="Shift"
        panOnDrag={appMode !== 'measure'}
        nodesDraggable={appMode !== 'measure'}
        nodesConnectable={appMode === 'design' || appMode === 'build'}
        elementsSelectable={appMode !== 'measure'}
        edgesFocusable
        edgesReconnectable={false}
        deleteKeyCode={null}
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