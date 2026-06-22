import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyCqpSM7AQoaNYq32VxoJ4MvVC8NvL4cmfE',
  authDomain: 'pcpga-church-prod.firebaseapp.com',
  projectId: 'pcpga-church-prod',
  storageBucket: 'pcpga-church-prod.firebasestorage.app',
  messagingSenderId: '264889432358',
  appId: '1:264889432358:web:356a6034802347a69e69e7',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// One-click Google sign-in for admins; always prompt for account choice.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// ignoreUndefinedProperties: a single `undefined` field anywhere in a payload
// otherwise makes setDoc() reject the entire write (e.g. saving the admin
// Church Directory). Dropping undefined fields is the right call for this CMS —
// a blank field should simply not be written, not block the whole Save.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-southeast1');
