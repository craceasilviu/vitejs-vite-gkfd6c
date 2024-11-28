import { derived } from 'svelte/store';
import { createPersistedStore } from '../lib/store';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { showSuccess, showError } from '../lib/toast';
import { navigate } from '../lib/router';

// Create auth store with persistence
export const authStore = createPersistedStore('auth', {
  user: null,
  loading: true,
  error: null
});

// Derived store for authentication status
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.user !== null
);

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        authStore.set({
          user: {
            ...userData,
            id: user.uid,
            email: user.email
          },
          loading: false,
          error: null
        });
      } else {
        throw new Error('User document not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      authStore.set({
        user: null,
        loading: false,
        error: error.message
      });
    }
  } else {
    authStore.set({
      user: null,
      loading: false,
      error: null
    });
  }
});

// Sign in with email and password
export async function signIn(email, password) {
  try {
    authStore.loading.set(true);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    showSuccess('Welcome back!');
    return user;
  } catch (error) {
    console.error('Sign in error:', error);
    showError(error.message);
    throw error;
  } finally {
    authStore.loading.set(false);
  }
}

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    authStore.set({
      user: null,
      loading: false,
      error: null
    });
    showSuccess('Logged out successfully');
    navigate('/login');
  } catch (error) {
    console.error('Sign out error:', error);
    showError(error.message);
    throw error;
  }
}