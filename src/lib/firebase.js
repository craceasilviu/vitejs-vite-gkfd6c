import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { showError } from './toast';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    showError('Multiple tabs open. Offline mode only works in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    showError('Browser does not support offline storage');
  }
});

// Check online status
export function checkOnlineStatus() {
  return navigator.onLine;
}

// Add network status listeners
window.addEventListener('online', () => {
  showError('Connection restored');
});

window.addEventListener('offline', () => {
  showError('You are offline. Some features may be limited.');
});

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
  if (!user) {
    // Clear any cached data when user signs out
    localStorage.clear();
    sessionStorage.clear();
  }
});