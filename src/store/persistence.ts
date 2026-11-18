import { getDb } from './db'
import {
  SESSION_KEY,
  type CircuitDocument,
  type SessionState,
} from './types'

export async function listDesigns(): Promise<CircuitDocument[]> {
  const db = await getDb()
  const all = await db.getAll('designs')
  return all.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function getDesign(id: string): Promise<CircuitDocument | undefined> {
  const db = await getDb()
  return db.get('designs', id)
}

export async function putDesign(doc: CircuitDocument): Promise<void> {
  const db = await getDb()
  await db.put('designs', doc)
}

export async function deleteDesign(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('designs', id)
}

export async function loadSession(): Promise<SessionState | undefined> {
  const db = await getDb()
  return db.get('meta', SESSION_KEY)
}

export async function saveSession(session: SessionState): Promise<void> {
  const db = await getDb()
  await db.put('meta', session, SESSION_KEY)
}