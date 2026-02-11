/**
 * Signal Protocol Session Store
 * 
 * Uses IndexedDB (via idb) to persist Signal Protocol sessions,
 * identity keys, and pre-keys across page reloads.
 * 
 * TODO: Implement actual IndexedDB storage when Signal Protocol WASM is integrated.
 * Reference: src/Arkiv/hooks/useE2EConversations.ts on the server.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'dexster-signal';
const DB_VERSION = 1;

const STORES = {
  sessions: 'sessions',
  identityKeys: 'identityKeys',
  preKeys: 'preKeys',
  signedPreKeys: 'signedPreKeys',
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.sessions)) {
          db.createObjectStore(STORES.sessions);
        }
        if (!db.objectStoreNames.contains(STORES.identityKeys)) {
          db.createObjectStore(STORES.identityKeys);
        }
        if (!db.objectStoreNames.contains(STORES.preKeys)) {
          db.createObjectStore(STORES.preKeys);
        }
        if (!db.objectStoreNames.contains(STORES.signedPreKeys)) {
          db.createObjectStore(STORES.signedPreKeys);
        }
      },
    });
  }
  return dbPromise;
}

export async function storeSession(key: string, session: ArrayBuffer): Promise<void> {
  const db = await getDB();
  await db.put(STORES.sessions, session, key);
}

export async function loadSession(key: string): Promise<ArrayBuffer | undefined> {
  const db = await getDB();
  return db.get(STORES.sessions, key);
}

export async function deleteSession(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.sessions, key);
}

export async function storeIdentityKey(userId: string, key: ArrayBuffer): Promise<void> {
  const db = await getDB();
  await db.put(STORES.identityKeys, key, userId);
}

export async function loadIdentityKey(userId: string): Promise<ArrayBuffer | undefined> {
  const db = await getDB();
  return db.get(STORES.identityKeys, userId);
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Object.values(STORES), 'readwrite');
  await Promise.all(Object.values(STORES).map(store => tx.objectStore(store).clear()));
  await tx.done;
}
