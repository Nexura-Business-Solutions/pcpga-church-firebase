import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/firebase.js', () => ({ db: {} }));

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const addDocMock = vi.fn();
const setDocMock = vi.fn();
const deleteDocMock = vi.fn();
const collectionMock = vi.fn(() => ({ _ref: 'collection' }));
const docMock = vi.fn(() => ({ _ref: 'doc' }));
const queryMock = vi.fn(() => ({ _ref: 'query' }));
const orderByMock = vi.fn(() => 'orderBy');

vi.mock('firebase/firestore', () => ({
  collection: (...a) => collectionMock(...a),
  doc: (...a) => docMock(...a),
  getDocs: (...a) => getDocsMock(...a),
  getDoc: (...a) => getDocMock(...a),
  addDoc: (...a) => addDocMock(...a),
  setDoc: (...a) => setDocMock(...a),
  deleteDoc: (...a) => deleteDocMock(...a),
  query: (...a) => queryMock(...a),
  orderBy: (...a) => orderByMock(...a),
  serverTimestamp: () => 'TS',
}));

import { listSermons, getSermon, createSermon, updateSermon, deleteSermon } from '../../src/lib/firestore.js';

describe('firestore lib', () => {
  it('listSermons returns array of {id, ...data}', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        { id: 's1', data: () => ({ title: 'A' }) },
        { id: 's2', data: () => ({ title: 'B' }) },
      ],
    });
    const out = await listSermons();
    expect(out).toEqual([{ id: 's1', title: 'A' }, { id: 's2', title: 'B' }]);
  });

  it('getSermon returns {id, ...data} when exists', async () => {
    getDocMock.mockResolvedValue({
      id: 's1',
      exists: () => true,
      data: () => ({ title: 'A' }),
    });
    const out = await getSermon('s1');
    expect(out).toEqual({ id: 's1', title: 'A' });
  });

  it('getSermon returns null when missing', async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    expect(await getSermon('missing')).toBeNull();
  });

  it('createSermon calls addDoc with createdAt stamp', async () => {
    addDocMock.mockResolvedValue({ id: 'new' });
    const out = await createSermon({ title: 'Z' });
    expect(addDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: 'Z', createdAt: 'TS' }),
    );
    expect(out).toBe('new');
  });

  it('updateSermon calls setDoc with merge', async () => {
    await updateSermon('s1', { title: 'updated' });
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'updated' },
      { merge: true },
    );
  });

  it('deleteSermon calls deleteDoc', async () => {
    await deleteSermon('s1');
    expect(deleteDocMock).toHaveBeenCalled();
  });
});
