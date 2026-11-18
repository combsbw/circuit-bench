import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CircuitDocument, SessionState } from './types'

interface CircuitBenchDB extends DBSchema {
  designs: {
    key: string
    value: CircuitDocument
    indexes: { 'by-name': string; 'by-updated': string }
  }
  meta: {
    key: string
    value: SessionState
  }
}

const DB_NAME = 'circuit-bench'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<CircuitBenchDB>> | null = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CircuitBenchDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const designs = db.createObjectStore('designs', { keyPath: 'id' })
        designs.createIndex('by-name', 'name')
        designs.createIndex('by-updated', 'updatedAt')
        db.createObjectStore('meta')
      },
    })
  }
  return dbPromise
}