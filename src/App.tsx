import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircuitCanvas } from './components/CircuitCanvas'
import { ComponentPalette, type PaletteItem } from './components/ComponentPalette'
import {
  InspectorDrawer,
  type InspectorPatch,
} from './components/InspectorDrawer'
import { PinoutPanel } from './components/PinoutPanel'
import { DocumentMenu } from './components/DocumentMenu'
import { MeasurePanel } from './components/MeasurePanel'
import { ModePanel } from './components/ModePanel'
import { Toolbar } from './components/Toolbar'
import { usePwaInstall } from './hooks/usePwaInstall'
import type { PlaceholderNodeData } from './components/nodes/CircuitPartNode'
import {
  documentFromSession,
  exportFilename,
  fingerprint,
  freshSession,
  sessionFromDocument,
  serializeForExport,
} from './store/documentUtils'
import {
  getDesign,
  listDesigns,
  loadSession,
  putDesign,
  saveSession,
} from './store/persistence'
import type { AppMode, ModeProgress, SessionState } from './store/types'
import { setNodeSeq } from './utils/nodeIds'
import { downloadJson } from './utils/download'
import type { Node } from '@xyflow/react'
import './App.css'

function isDirty(session: SessionState): boolean {
  const fp = fingerprint(
    session.graph,
    session.mode,
    session.buildProgress,
    session.troubleshootProgress,
    session.measureState,
  )
  return session.savedFingerprint !== fp
}

function App() {
  const addPartRef = useRef<((item: PaletteItem) => void) | null>(null)
  const patchNodeRef = useRef<
    ((nodeId: string, patch: InspectorPatch) => void) | null
  >(null)
  const [session, setSession] = useState<SessionState>(() => freshSession())
  const [graphKey, setGraphKey] = useState('initial')
  const [menuOpen, setMenuOpen] = useState(false)
  const [designs, setDesigns] = useState<Awaited<ReturnType<typeof listDesigns>>>(
    [],
  )
  const [saving, setSaving] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [pinoutCatalogId, setPinoutCatalogId] = useState<string | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { canInstall, showIosHint, install } = usePwaInstall()

  const dirty = useMemo(() => isDirty(session), [session])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [saved, catalog] = await Promise.all([loadSession(), listDesigns()])
      if (cancelled) return
      if (saved) {
        setNodeSeq(saved.graph.nodeSeq)
        setSession({
          ...saved,
          measureState: {
            probeA: saved.measureState?.probeA ?? null,
            probeB: saved.measureState?.probeB ?? null,
            dmmTool: saved.measureState?.dmmTool ?? 'resistance',
          },
        })
        setGraphKey(saved.documentId ?? `session-${saved.updatedAt}`)
      }
      setDesigns(catalog)
      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const payload: SessionState = {
        ...session,
        updatedAt: new Date().toISOString(),
      }
      void saveSession(payload)
    }, 700)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [session, hydrated])

  const handleRegisterAdd = useCallback((fn: (item: PaletteItem) => void) => {
    addPartRef.current = fn
  }, [])

  const handleRegisterPatch = useCallback(
    (fn: (nodeId: string, patch: InspectorPatch) => void) => {
      patchNodeRef.current = fn
    },
    [],
  )

  const handleAddFromPalette = useCallback((item: PaletteItem) => {
    addPartRef.current?.(item)
  }, [])

  const applySession = useCallback((next: SessionState) => {
    setNodeSeq(next.graph.nodeSeq)
    setSession(next)
    setGraphKey(next.documentId ?? `draft-${Date.now()}`)
  }, [])

  const confirmIfDirty = useCallback((): boolean => {
    if (!dirty) return true
    return window.confirm(
      'Discard unsaved changes to the current design?',
    )
  }, [dirty])

  const refreshDesigns = useCallback(async () => {
    setDesigns(await listDesigns())
  }, [])

  const handleGraphChange = useCallback(
    (graph: SessionState['graph']) => {
      setSession((s) => ({ ...s, graph }))
    },
    [],
  )

  const handleWireAdded = useCallback(() => {
    setSession((s) => ({
      ...s,
      buildProgress: {
        ...s.buildProgress,
        checks: { ...s.buildProgress.checks, wiring: true },
      },
    }))
  }, [])

  const handleCatalogPlaced = useCallback((catalogId: string) => {
    setPinoutCatalogId(catalogId)
  }, [])

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedNodeIds(ids)
    if (ids.length > 0) setInspectorOpen(true)
  }, [])

  const selectedNode = useMemo(() => {
    const id = selectedNodeIds[0]
    if (!id) return null
  const node = session.graph.nodes.find((n) => n.id === id)
    return node ?? null
  }, [selectedNodeIds, session.graph.nodes])

  const handleInspectorPatch = useCallback(
    (nodeId: string, patch: InspectorPatch) => {
      patchNodeRef.current?.(nodeId, patch)
      setSession((s) => ({
        ...s,
        graph: {
          ...s.graph,
          nodes: s.graph.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
          ),
        },
      }))
    },
    [],
  )

  const handleModeChange = useCallback((mode: AppMode) => {
    setSession((s) => ({ ...s, mode }))
  }, [])

  const handleBuildChange = useCallback((buildProgress: ModeProgress) => {
    setSession((s) => ({ ...s, buildProgress }))
  }, [])

  const handleTroubleshootChange = useCallback(
    (troubleshootProgress: ModeProgress) => {
      setSession((s) => ({ ...s, troubleshootProgress }))
    },
    [],
  )

  const handleMeasureChange = useCallback(
    (measureState: SessionState['measureState']) => {
      setSession((s) => ({ ...s, measureState }))
    },
    [],
  )

  const handleProbePick = useCallback((nodeId: string) => {
    setSession((s) => {
      const { probeA, probeB, dmmTool } = s.measureState
      if (dmmTool === 'dc_voltage') {
        return {
          ...s,
          measureState: { ...s.measureState, probeA: { nodeId }, probeB: null },
        }
      }
      if (!probeA || (probeA && probeB)) {
        return {
          ...s,
          measureState: { ...s.measureState, probeA: { nodeId }, probeB: null },
        }
      }
      if (probeA.nodeId === nodeId) return s
      return {
        ...s,
        measureState: { ...s.measureState, probeA, probeB: { nodeId } },
      }
    })
  }, [])

  const handleApplyValues = useCallback(
    (
      componentIds: string[],
      slotToKind: Record<string, 'resistor' | 'capacitor' | 'inductor' | 'voltage_source'>,
      values: Record<string, string>,
    ) => {
      setSession((s) => {
        const resistors = componentIds.filter((id) => {
          const node = s.graph.nodes.find((x) => x.id === id)
          return (node?.data as PlaceholderNodeData).kind === 'resistor'
        })
        const nodes = s.graph.nodes.map((node) => {
          const n = node as Node<PlaceholderNodeData>
          if (!componentIds.includes(n.id)) return node
          let nextValue = n.data.value
          if (values.R1 && resistors[0] === n.id) nextValue = values.R1
          if (values.R2 && resistors[1] === n.id) nextValue = values.R2
          for (const [slot, v] of Object.entries(values)) {
            const expected = slotToKind[slot]
            if (expected && n.data.kind === expected && slot !== 'R1' && slot !== 'R2') {
              nextValue = v
            }
          }
          return {
            ...node,
            data: { ...n.data, value: nextValue },
          }
        })
        return { ...s, graph: { ...s.graph, nodes: nodes as typeof s.graph.nodes } }
      })
    },
    [],
  )

  const persistNamed = useCallback(
    async (name: string, overwrite: boolean) => {
      setSaving(true)
      try {
        const byName = designs.find(
          (d) => d.name.toLowerCase() === name.toLowerCase(),
        )
        let existing = byName
        if (!existing && overwrite && session.documentId) {
          existing = await getDesign(session.documentId)
        }
        const doc = documentFromSession(session, name, existing)
        await putDesign(doc)
        const next = sessionFromDocument(doc)
        setSession(next)
        await refreshDesigns()
        return next
      } finally {
        setSaving(false)
      }
    },
    [session, designs, refreshDesigns],
  )

  const handleQuickSave = useCallback(() => {
    if (session.documentName) {
      void persistNamed(session.documentName, true)
      return
    }
    setMenuOpen(true)
  }, [session.documentName, persistNamed])

  const handleSave = useCallback(
    async (name: string, overwrite: boolean) => {
      await persistNamed(name, overwrite)
    },
    [persistNamed],
  )

  const handleLoad = useCallback(
    async (id: string) => {
      if (!confirmIfDirty()) return
      const doc = await getDesign(id)
      if (!doc) return
      applySession(sessionFromDocument(doc))
      setMenuOpen(false)
    },
    [applySession, confirmIfDirty],
  )

  const handleNew = useCallback(() => {
    if (!confirmIfDirty()) return
    const next = freshSession()
    applySession(next)
    setMenuOpen(false)
  }, [applySession, confirmIfDirty])

  const handleExport = useCallback(() => {
    const doc = serializeForExport(session)
    downloadJson(exportFilename(session.documentName), doc)
  }, [session])

  if (!hydrated) {
    return (
      <div className="app app--loading">
        <p className="app__loading">Loading Circuit Bench…</p>
      </div>
    )
  }

  const sidePanel =
    session.mode === 'design' ? (
      <ComponentPalette onAddPart={handleAddFromPalette} />
    ) : session.mode === 'measure' ? (
      <MeasurePanel
        nodes={session.graph.nodes}
        edges={session.graph.edges}
        measure={session.measureState}
        selectedNodeIds={selectedNodeIds}
        onMeasureChange={handleMeasureChange}
        onApplyValues={handleApplyValues}
      />
    ) : (
      <ModePanel
        mode={session.mode}
        nodes={session.graph.nodes}
        edges={session.graph.edges}
        buildProgress={session.buildProgress}
        troubleshootProgress={session.troubleshootProgress}
        onBuildChange={handleBuildChange}
        onTroubleshootChange={handleTroubleshootChange}
        onFocusNode={(id) => setFocusNodeId(`${id}#${Date.now()}`)}
      />
    )

  return (
    <div className="app">
      <Toolbar
        mode={session.mode}
        onModeChange={handleModeChange}
        designLabel={session.documentName}
        isDirty={dirty}
        onOpenMenu={() => setMenuOpen(true)}
        onQuickSave={handleQuickSave}
        onNew={handleNew}
        onExport={handleExport}
      />
      <main className="app__main">
        {sidePanel}
        <div className="app__canvas-wrap">
          <CircuitCanvas
            graphKey={graphKey}
            appMode={session.mode}
            initialNodes={session.graph.nodes}
            initialEdges={session.graph.edges}
            viewport={session.graph.viewport}
            probeA={session.measureState.probeA}
            probeB={session.measureState.probeB}
            onGraphChange={handleGraphChange}
            onRegisterAdd={handleRegisterAdd}
            onRegisterPatch={handleRegisterPatch}
            onSelectionChange={handleSelectionChange}
            onProbePick={handleProbePick}
            onWireAdded={handleWireAdded}
            onCatalogPlaced={handleCatalogPlaced}
            focusNodeId={focusNodeId}
          />
          {session.mode === 'design' || session.mode === 'build' ? (
            <InspectorDrawer
              open={inspectorOpen && selectedNodeIds.length > 0}
              node={selectedNode}
              onClose={() => setInspectorOpen(false)}
              onPatch={handleInspectorPatch}
              onOpenPinout={setPinoutCatalogId}
            />
          ) : null}
          <PinoutPanel
            catalogId={pinoutCatalogId}
            onClose={() => setPinoutCatalogId(null)}
          />
        </div>
      </main>
      <DocumentMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        designs={designs}
        currentName={session.documentName}
        saving={saving}
        onNew={handleNew}
        onSave={(name, overwrite) => void handleSave(name, overwrite)}
        onLoad={(id) => void handleLoad(id)}
        onExport={handleExport}
        canInstall={canInstall}
        onInstall={() => void install()}
        showIosHint={showIosHint}
      />
    </div>
  )
}

export default App