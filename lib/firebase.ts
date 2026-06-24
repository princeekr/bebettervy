import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as firebaseSignOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

setPersistence(auth, browserLocalPersistence).catch(console.error);

const provider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    localStorage.setItem('session_start', Date.now().toString());
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with popup:', error);
    // If popup is blocked or fails, try redirect
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError: any) {
      console.error('Error signing in with redirect:', redirectError);
      alert('Authentication failed: ' + (error.message || redirectError.message));
      throw redirectError;
    }
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('session_start');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { auth, db, onAuthStateChanged };
