import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { currentUser } from '../stores/users';
import { showSuccess, showError } from '../lib/toast';

// Update user profile
export async function updateUserProfile(userId, profileData) {
  if (!userId) {
    showError('Invalid user ID');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    // Merge existing data with updates
    const updatedData = {
      ...userDoc.data(),
      ...profileData,
      updatedAt: new Date().toISOString()
    };

    // Preserve critical fields
    delete updatedData.email; // Email can't be changed
    delete updatedData.role; // Role can't be changed
    delete updatedData.createdAt; // Creation date can't be changed

    await setDoc(userRef, updatedData, { merge: true });

    // Update current user if it's the logged-in user
    if (auth.currentUser?.uid === userId) {
      currentUser.update(current => ({
        ...current,
        ...updatedData
      }));
    }

    showSuccess('Profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    showError(error.message);
    return false;
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}