import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function run() {
  try {
    await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log("Create user succeeded");
  } catch (e) {
    console.error("Create user failed:", e.code);
  }
  try {
    await signInAnonymously(auth);
    console.log("Anon auth succeeded");
  } catch (e) {
    console.error("Anon auth failed:", e.code);
  }
  process.exit(0);
}
run();
