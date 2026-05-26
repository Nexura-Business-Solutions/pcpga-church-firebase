import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
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
        setIsAdmin(snap.exists());
        setRole(snap.exists() ? (snap.data().role || 'admin') : null);
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
