import {
  DEFAULT_BUILD_CHECKS,
  DEFAULT_TROUBLESHOOT_CHECKS,
  defaultGraph,
  defaultMeasureState,
  defaultSession,
  emptyModeProgress,
  type AppMode,
  type CircuitDocument,
  type GraphSnapshot,
  type MeasureState,
  type ModeProgress,
  type SessionState,
} from './types'

export function fingerprint(
  graph: GraphSnapshot,
  mode: AppMode,
  buildProgress: ModeProgress,
  troubleshootProgress: ModeProgress,
  measureState: MeasureState,
): string {
  return JSON.stringify({
    graph,
    mode,
    buildProgress,
    troubleshootProgress,
    measureState,
  })
}

export function sessionFromDocument(doc: CircuitDocument): SessionState {
  const measureState = doc.measureState ?? defaultMeasureState()
  return {
    documentId: doc.id,
    documentName: doc.name,
    graph: doc.graph,
    mode: doc.mode,
    buildProgress: doc.buildProgress,
    troubleshootProgress: doc.troubleshootProgress,
    measureState,
    savedFingerprint: fingerprint(
      doc.graph,
      doc.mode,
      doc.buildProgress,
      doc.troubleshootProgress,
      measureState,
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function documentFromSession(
  session: SessionState,
  name: string,
  existing?: CircuitDocument,
): CircuitDocument {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    graph: session.graph,
    mode: session.mode,
    buildProgress: session.buildProgress,
    troubleshootProgress: session.troubleshootProgress,
    measureState: session.measureState,
  }
}

export function freshSession(name: string | null = null): SessionState {
  return {
    ...defaultSession(),
    documentName: name,
    savedFingerprint: fingerprint(
      defaultGraph(),
      'design',
      emptyModeProgress(DEFAULT_BUILD_CHECKS),
      emptyModeProgress(DEFAULT_TROUBLESHOOT_CHECKS),
      defaultMeasureState(),
    ),
  }
}

export function exportFilename(name: string | null): string {
  const base = (name ?? 'untitled')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'circuit'}.json`
}

export function serializeForExport(session: SessionState): CircuitDocument {
  return documentFromSession(session, session.documentName ?? 'Untitled')
}