import { writable } from 'svelte/store';
import { 
  collection, 
  onSnapshot,
  query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { showError } from '../lib/toast';

// Store unsubscribe functions
const unsubscribers = new Map();

// Function to setup real-time listener
export function setupRealtimeListener(collectionName, store, customQuery = null) {
  // Clean up existing listener if any
  if (unsubscribers.has(collectionName)) {
    unsubscribers.get(collectionName)();
  }

  try {
    // Setup new listener
    const ref = customQuery || query(collection(db, collectionName));
    
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        store.set(data);
      },
      (err) => {
        console.error(`Error in ${collectionName} listener:`, err);
        showError(`Failed to load ${collectionName}: ${err.message}`);
      }
    );

    // Store unsubscribe function
    unsubscribers.set(collectionName, unsubscribe);
    return unsubscribe;
  } catch (err) {
    console.error(`Error setting up ${collectionName} listener:`, err);
    showError(err.message);
    return null;
  }
}

// Cleanup function
export function cleanupListeners() {
  for (const unsubscribe of unsubscribers.values()) {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  }
  unsubscribers.clear();
}