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

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        // Admins are keyed by lowercased email so they can be managed from the
        // console (add by email — no uid lookup needed).
        const email = (u.email || '').trim().toLowerCase();
        const snap = await getDoc(doc(db, 'admins', email));
        if (snap.exists()) {
          setIsAdmin(true);
          setRole(snap.data().role || 'admin');
        } else {
          // Authenticated but not on the allowlist (e.g. a random Google
          // account): drop the session so no non-admin stays signed in.
          setIsAdmin(false);
          setRole(null);
          await signOut(auth);
        }
      } catch (err) {
        // A denied/failed read must not leave the app stuck on "Loading…".
        // Treat any failure as "not an admin" and let routing redirect cleanly.
        console.error('admin check failed:', err);
        setIsAdmin(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return { user, isAdmin, role, isOwner: role === 'owner', loading };
}
