import { describe, it, expect } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';

// firebase-functions v7 initializes a NAMED admin app ("__FIREBASE_FUNCTIONS_SDK__")
// while verifying callable auth tokens — BEFORE the handler runs. getDb() must
// still initialize the [DEFAULT] app in that case, or getFirestore() throws
// "The default Firebase app does not exist" on every invocation.
describe('getDb', () => {
  it('initializes the default app even when only a named app exists', async () => {
    initializeApp({ projectId: 'pcpga-test' }, '__FIREBASE_FUNCTIONS_SDK__');
    expect(getApps().length).toBe(1);

    const { getDb } = await import('../lib/firestore.js');
    const db = getDb();

    expect(db).toBeTruthy();
    expect(getApps().some((app) => app.name === '[DEFAULT]')).toBe(true);
  });
});
