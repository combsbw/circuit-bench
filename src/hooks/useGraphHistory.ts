import { useCallback, useRef, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'

const MAX_HISTORY = 48

export type GraphSnapshotSlice = {
  nodes: Node<PlaceholderNodeData>[]
  edges: Edge[]
}

function cloneSlice(s: GraphSnapshotSlice): GraphSnapshotSlice {
  return {
    nodes: structuredClone(s.nodes),
    edges: structuredClone(s.edges),
  }
}

export function useGraphHistory() {
  const pastRef = useRef<GraphSnapshotSlice[]>([])
  const futureRef = useRef<GraphSnapshotSlice[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const bump = () => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }

  const commit = useCallback((before: GraphSnapshotSlice) => {
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), cloneSlice(before)]
    futureRef.current = []
    bump()
  }, [])

  const undo = useCallback(
    (current: GraphSnapshotSlice): GraphSnapshotSlice | null => {
      const stack = pastRef.current
      if (stack.length === 0) return null
      const prev = stack[stack.length - 1]!
      pastRef.current = stack.slice(0, -1)
      futureRef.current = [cloneSlice(current), ...futureRef.current]
      bump()
      return cloneSlice(prev)
    },
    [],
  )

  const redo = useCallback(
    (current: GraphSnapshotSlice): GraphSnapshotSlice | null => {
      const stack = futureRef.current
      if (stack.length === 0) return null
      const next = stack[0]!
      futureRef.current = stack.slice(1)
      pastRef.current = [...pastRef.current, cloneSlice(current)]
      bump()
      return cloneSlice(next)
    },
    [],
  )

  return {
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}