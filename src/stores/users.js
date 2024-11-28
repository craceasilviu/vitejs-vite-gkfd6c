import { writable } from 'svelte/store';
import { auth, db } from '../lib/firebase';
import { 
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { showError } from '../lib/toast';
import { createStore } from '../lib/store';

// Create stores
export const users = createStore([]);
export const currentUser = createStore(null);
export const loading = writable(false);

// Initialize users collection listener
let unsubscribe;

export function initializeUsersListener() {
  if (unsubscribe) {
    unsubscribe();
  }

  try {
    loading.set(true);
    const usersQuery = query(collection(db, 'users'));
    
    unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        users.set(data);
        loading.set(false);
      },
      (error) => {
        console.error('Users listener error:', error);
        showError('Failed to load users');
        loading.set(false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up users listener:', err);
    showError(err.message);
    loading.set(false);
    return null;
  }
}

// Cleanup function
export function cleanup() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// Initialize the store
initializeUsersListener();