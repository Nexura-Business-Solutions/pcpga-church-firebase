import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db;
export function getDb() {
  if (!db) {
    // firebase-functions v7 creates a NAMED app ("__FIREBASE_FUNCTIONS_SDK__")
    // while verifying callable auth tokens, so "any app exists" is the wrong
    // check — getFirestore() needs the [DEFAULT] app specifically.
    if (!getApps().some((app) => app.name === '[DEFAULT]')) {
      initializeApp({ credential: applicationDefault() });
    }
    db = getFirestore();
  }
  return db;
}
