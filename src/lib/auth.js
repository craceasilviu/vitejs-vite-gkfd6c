import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { currentUser } from '../stores/users';
import { showSuccess, showError } from './toast';
import { navigate } from './router';
import { cleanupListeners } from '../stores/firestore';
import { clearSession, restoreSession } from '../stores/session';

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
  try {
    if (user) {
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        currentUser.set({
          id: user.uid,
          email: user.email,
          ...userData
        });

        // Try to restore last session
        restoreSession();
      } else {
        // Create default user profile if none exists
        const defaultProfile = {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: 'producer', // Default role
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        currentUser.set({
          id: user.uid,
          ...defaultProfile
        });
      }
    } else {
      currentUser.set(null);
      cleanupListeners();
      clearSession();
    }
  } catch (error) {
    console.error('Error handling auth state change:', error);
    showError('Failed to load user profile');
  }
});

// Sign in with email and password
export async function signIn(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Get or create user profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData;
    
    if (userDoc.exists()) {
      userData = userDoc.data();
      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } else {
      // Create default profile
      userData = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: 'producer',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), userData);
    }

    currentUser.set({
      id: user.uid,
      email: user.email,
      ...userData
    });

    showSuccess('Welcome back!');

    // Try to restore last session, otherwise navigate based on role
    if (!restoreSession()) {
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }

    return user;
  } catch (error) {
    console.error('Sign in error:', error);
    showError(error.message);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    const user = auth.currentUser;
    if (user) {
      // Update last seen timestamp
      await setDoc(doc(db, 'users', user.uid), {
        lastSeen: new Date().toISOString()
      }, { merge: true });
    }

    await firebaseSignOut(auth);
    currentUser.set(null);
    cleanupListeners();
    clearSession();
    showSuccess('Logged out successfully');
    navigate('/login');
  } catch (error) {
    console.error('Sign out error:', error);
    showError(error.message);
    throw error;
  }
}