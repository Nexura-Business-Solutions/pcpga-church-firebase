import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../../src/lib/firebase.js', () => ({
  auth: {},
  db: {},
}));

const onAuthStateChangedMock = vi.fn();
const getDocMock = vi.fn();
const docMock = vi.fn(() => ({ _ref: 'admins-doc' }));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => onAuthStateChangedMock(...args),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args) => docMock(...args),
  getDoc: (...args) => getDocMock(...args),
}));

import { useAuth } from '../../src/lib/auth.js';

describe('useAuth', () => {
  beforeEach(() => {
    onAuthStateChangedMock.mockReset();
    getDocMock.mockReset();
  });

  it('returns user=null, isAdmin=false, loading=false when signed out', async () => {
    onAuthStateChangedMock.mockImplementation((_a, cb) => { cb(null); return () => {}; });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns isAdmin=true when admins/{uid} exists', async () => {
    onAuthStateChangedMock.mockImplementation((_a, cb) => {
      cb({ uid: 'abc', email: 'pastor@pcpga.org' });
      return () => {};
    });
    getDocMock.mockResolvedValue({ exists: () => true });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user.uid).toBe('abc');
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isAdmin=false when admins/{uid} does not exist', async () => {
    onAuthStateChangedMock.mockImplementation((_a, cb) => {
      cb({ uid: 'xyz', email: 'random@example.com' });
      return () => {};
    });
    getDocMock.mockResolvedValue({ exists: () => false });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user.uid).toBe('xyz');
    expect(result.current.isAdmin).toBe(false);
  });
});
