import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db;
export function getDb() {
  if (!db) {
    if (getApps().length === 0) {
      initializeApp({ credential: applicationDefault() });
    }
    db = getFirestore();
  }
  return db;
}
