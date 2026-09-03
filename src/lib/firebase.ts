import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const firebaseConfig = config;
export const app = initializeApp(config);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, config.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
