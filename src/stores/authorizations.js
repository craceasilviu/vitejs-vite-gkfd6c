import { writable } from 'svelte/store';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { showSuccess, showError } from '../lib/toast';
import { createStore } from '../lib/store';

// Create store
export const authorizations = createStore([]);
export const loading = writable(false);

// Initialize authorizations collection listener
let unsubscribe;

export function initializeAuthorizationsListener() {
  if (unsubscribe) {
    unsubscribe();
  }

  try {
    loading.set(true);
    const authQuery = query(collection(db, 'authorizations'));
    
    unsubscribe = onSnapshot(authQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        authorizations.set(data);
        loading.set(false);
      },
      (error) => {
        console.error('Authorizations listener error:', error);
        showError('Failed to load authorizations');
        loading.set(false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up authorizations listener:', err);
    showError(err.message);
    loading.set(false);
    return null;
  }
}

// Add authorization
export async function addAuthorization(userId, productId) {
  if (!userId || !productId) {
    showError('Invalid user or product ID');
    return false;
  }

  try {
    loading.set(true);

    // Check if authorization already exists
    const existingQuery = query(
      collection(db, 'authorizations'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    
    const snapshot = await getDocs(existingQuery);
    if (!snapshot.empty) {
      return true; // Already authorized
    }

    // Add new authorization
    const authData = {
      userId,
      productId,
      authorizedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'authorizations'), authData);
    showSuccess('Product authorized successfully');
    return true;
  } catch (error) {
    console.error('Error adding authorization:', error);
    showError(error.message);
    return false;
  } finally {
    loading.set(false);
  }
}

// Remove authorization
export async function removeAuthorization(userId, productId) {
  if (!userId || !productId) {
    showError('Invalid user or product ID');
    return false;
  }

  try {
    loading.set(true);

    // Find the authorization document
    const authQuery = query(
      collection(db, 'authorizations'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    
    const snapshot = await getDocs(authQuery);
    if (snapshot.empty) {
      return true; // Already unauthorized
    }

    // Delete all matching authorizations
    const deletePromises = snapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    showSuccess('Authorization removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing authorization:', error);
    showError(error.message);
    return false;
  } finally {
    loading.set(false);
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
initializeAuthorizationsListener();