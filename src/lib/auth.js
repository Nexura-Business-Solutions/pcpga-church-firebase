import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.js';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Verify a signed-in Google user against the email allowlist
// (admins/{lowercased-email}); sign out + throw if they're not an admin.
async function enforceAllowlist(user) {
  const email = (user.email || '').trim().toLowerCase();
  const snap = await getDoc(doc(db, 'admins', email));
  if (!snap.exists()) {
    await signOut(auth);
    const err = new Error('This Google account is not an authorized admin.');
    err.code = 'admin/not-authorized';
    throw err;
  }
  return snap.data().role || 'admin';
}

// One-click Google sign-in (popup). Resolves to the admin role.
export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  return enforceAllowlist(user);
}

// Fallback for environments where popups are blocked/unsupported (in-app
// browsers, some mobile). Navigates away; completeGoogleRedirect() finishes it.
export function loginWithGoogleRedirect() {
  return signInWithRedirect(auth, googleProvider);
}

// Call once on load: if we just came back from a redirect sign-in, enforce the
// allowlist. Returns the role, or null when there is no pending redirect.
export async function completeGoogleRedirect() {
  const result = await getRedirectResult(auth);
  if (!result || !result.user) return null;
  return enforceAllowlist(result.user);
}

export function logout() {
  return signOut(auth);
}

export function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// Module-level cache of the resolved auth state. Each admin page mounts its own
// AdminRoute + AdminLayout (both call useAuth), and navigating between admin
// pages remounts them — without this cache every nav restarted at loading:true
// and flashed the loading screen ("blink"). Seeding useState from the cache means
// once auth has resolved, later mounts start already-resolved → clean load.
let authCache = { user: null, isAdmin: false, role: null, loading: true };

export function useAuth() {
  const [state, setState] = useState(authCache);

  useEffect(() => {
    const apply = (next) => { authCache = next; setState(next); };
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        apply({ user: null, isAdmin: false, role: null, loading: false });
        return;
      }
      try {
        // Admins are keyed by lowercased email so they can be managed from the
        // console (add by email — no uid lookup needed).
        const email = (u.email || '').trim().toLowerCase();
        const snap = await getDoc(doc(db, 'admins', email));
        if (snap.exists()) {
          apply({ user: u, isAdmin: true, role: snap.data().role || 'admin', loading: false });
        } else {
          // Authenticated but not on the allowlist (e.g. a random Google
          // account): drop the session so no non-admin stays signed in.
          apply({ user: u, isAdmin: false, role: null, loading: false });
          await signOut(auth);
        }
      } catch (err) {
        // A denied/failed read must not leave the app stuck on "Loading…".
        // Treat any failure as "not an admin" and let routing redirect cleanly.
        console.error('admin check failed:', err);
        apply({ user: u, isAdmin: false, role: null, loading: false });
      }
    });
  }, []);

  return { user: state.user, isAdmin: state.isAdmin, role: state.role, isOwner: state.role === 'owner', loading: state.loading };
}
