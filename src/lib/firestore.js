import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

function maker(name) {
  return {
    list: async () => {
      const q = query(collection(db, name), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    get: async (id) => {
      const snap = await getDoc(doc(db, name, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    create: async (data) => {
      const ref = await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() });
      return ref.id;
    },
    update: async (id, data) => {
      await setDoc(doc(db, name, id), data, { merge: true });
    },
    remove: async (id) => {
      await deleteDoc(doc(db, name, id));
    },
  };
}

const sermons   = maker('sermons');
const library   = maker('library');
const churches  = maker('churches');
const donations = maker('donations');
const donors    = maker('donors');

export const listSermons    = sermons.list;
export const getSermon      = sermons.get;
export const createSermon   = sermons.create;
export const updateSermon   = sermons.update;
export const deleteSermon   = sermons.remove;

export const listLibrary    = library.list;
export const getLibraryItem = library.get;
export const createLibraryItem = library.create;
export const updateLibraryItem = library.update;
export const deleteLibraryItem = library.remove;

export const listChurches   = churches.list;
export const getChurch      = churches.get;
export const createChurch   = churches.create;
export const updateChurch   = churches.update;
export const deleteChurch   = churches.remove;

export const listDonations  = donations.list;
export const getDonation    = donations.get;

export const listDonors     = donors.list;

export const getSetting = async (key) => {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data().value : null;
};
export const setSetting = async (key, value) => {
  await setDoc(doc(db, 'settings', key), { value }, { merge: true });
};
