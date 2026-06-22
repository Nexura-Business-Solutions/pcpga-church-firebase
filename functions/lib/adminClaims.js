import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Storage/Firestore rules gate admin writes on the `admin:true` custom claim
// (see storage.rules). Nothing used to grant that claim, so admins added via the
// Admins page could read but never upload — every Storage write 403'd. These
// helpers are the grant/revoke primitives the auto-claim triggers build on.

function ensureApp() {
  // Mirror getDb()'s check: firebase-functions v7 spins up a NAMED app while
  // verifying tokens, so "any app exists" is the wrong test — we need [DEFAULT].
  if (!getApps().some((app) => app.name === '[DEFAULT]')) {
    initializeApp({ credential: applicationDefault() });
  }
}

export function getAdminAuth() {
  ensureApp();
  return getAuth();
}

const normEmail = (email) => (email || '').trim().toLowerCase();

// Grant admin:true to the Auth user with this email, preserving any other
// claims. Auth is injectable for tests. Never throws on the expected
// "no Auth user yet" case: an admin can be added to Firestore before they have
// ever signed in — they get the claim at first sign-in via the auth onCreate
// trigger instead. The caller still refreshes its ID token to pick up the claim
// (the client's uploadFile() already force-refreshes before every upload).
export async function grantAdminClaim(email, auth = getAdminAuth()) {
  const normalized = normEmail(email);
  if (!normalized) return { status: 'skipped', reason: 'empty-email' };

  let user;
  try {
    user = await auth.getUserByEmail(normalized);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      return { status: 'pending', reason: 'no-auth-user', email: normalized };
    }
    throw err;
  }

  if (user.customClaims?.admin === true) {
    return { status: 'noop', reason: 'already-admin', uid: user.uid };
  }
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  return { status: 'granted', uid: user.uid, email: normalized };
}

// Strip the admin claim (used when an admin doc is deleted). Leaves any other
// claims intact.
export async function revokeAdminClaim(email, auth = getAdminAuth()) {
  const normalized = normEmail(email);
  if (!normalized) return { status: 'skipped', reason: 'empty-email' };

  let user;
  try {
    user = await auth.getUserByEmail(normalized);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      return { status: 'noop', reason: 'no-auth-user' };
    }
    throw err;
  }

  if (!user.customClaims?.admin) {
    return { status: 'noop', reason: 'not-admin', uid: user.uid };
  }
  const rest = { ...(user.customClaims || {}) };
  delete rest.admin;
  await auth.setCustomUserClaims(user.uid, rest);
  return { status: 'revoked', uid: user.uid, email: normalized };
}
