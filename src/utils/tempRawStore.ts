// src/utils/tempRawStore.ts
import { ParsedTempPoint } from '../types/temperature';

const DB_NAME = 'fsos_temperature_db';
const DB_VERSION = 1;
const STORE_NAME = 'raw_records';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('[TempRawStore] Failed to open IndexedDB:', request.error);
      resolve(null);
    };
  });

  return dbPromise;
}

export const TempRawStore = {
  async saveRawRecords(recordId: string, rawRecords: ParsedTempPoint[]): Promise<void> {
    if (!recordId || !rawRecords || rawRecords.length === 0) return;
    try {
      const db = await openDB();
      if (!db) return;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(rawRecords, recordId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[TempRawStore] Error saving raw records to IndexedDB:', err);
    }
  },

  async getRawRecords(recordId: string): Promise<ParsedTempPoint[] | null> {
    if (!recordId) return null;
    try {
      const db = await openDB();
      if (!db) return null;
      return await new Promise<ParsedTempPoint[] | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(recordId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn('[TempRawStore] Error reading raw records from IndexedDB:', err);
      return null;
    }
  },

  async deleteRawRecords(recordId: string): Promise<void> {
    if (!recordId) return;
    try {
      const db = await openDB();
      if (!db) return;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(recordId);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[TempRawStore] Error deleting raw records from IndexedDB:', err);
    }
  }
};
