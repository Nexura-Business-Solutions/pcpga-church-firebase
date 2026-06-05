import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.js';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// One-click Google sign-in. Access is gated by the email allowlist
// (admins/{lowercased-email}); a Google account that isn't on it is signed
// straight back out so no non-admin session lingers. Resolves to the role.
export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
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
