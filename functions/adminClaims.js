import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as functionsV1 from 'firebase-functions/v1';
import { getDb } from './lib/firestore.js';
import { grantAdminClaim, revokeAdminClaim } from './lib/adminClaims.js';

// Auto-grant the `admin:true` custom claim that Storage/Firestore rules require,
// so adding someone via the Admins page is all it takes for them to upload.
// Two triggers cover the two ways an admin appears:
//   1. onAdminWritten  — the admins/{email} doc is created/updated/deleted.
//   2. onAuthUserCreated — a brand-new user signs in; if they were added to the
//      admins collection BEFORE ever signing in, there was no Auth user to set
//      the claim on at write time — this catches them on first sign-in.
// Handlers are split from the trigger wiring so they can be unit-tested
// (mirrors the createInvoiceHandler pattern).

// event.data is a Change<DocumentSnapshot> with .before/.after; .exists is a
// boolean property on each snapshot. Doc id (event.params.email) is already the
// lowercased email — setAdmin() keys docs that way.
export async function onAdminWrittenHandler(event) {
  const email = event.params?.email;
  const existedBefore = event.data?.before?.exists;
  const existsAfter = event.data?.after?.exists;

  if (existsAfter) {
    return grantAdminClaim(email); // created or updated
  }
  if (existedBefore) {
    return revokeAdminClaim(email); // deleted
  }
  return { status: 'noop', reason: 'no-change' };
}

export async function onAuthUserCreatedHandler(user, db = getDb()) {
  const email = (user.email || '').trim().toLowerCase();
  if (!email) return { status: 'skipped', reason: 'no-email' };

  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return { status: 'noop', reason: 'not-an-admin' };

  return grantAdminClaim(email);
}

// v2 Firestore trigger — region must match the database location.
export const onAdminWritten = onDocumentWritten(
  { document: 'admins/{email}', region: 'asia-southeast1' },
  onAdminWrittenHandler,
);

// v1 auth onCreate is the classic Firebase Auth trigger (GA, no Identity
// Platform needed). The claim lands on the next ID-token refresh.
export const onAuthUserCreated = functionsV1
  .auth.user()
  .onCreate((user) => onAuthUserCreatedHandler(user));
