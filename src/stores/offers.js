import { writable } from 'svelte/store';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { showSuccess, showError } from '../lib/toast';
import { createStore } from '../lib/store';

export const OFFER_STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision'
};

// Create store
export const offers = createStore([]);
export const loading = writable(false);

// Initialize offers collection listener
let unsubscribe;

export function initializeOffersListener() {
  if (unsubscribe) {
    unsubscribe();
  }

  try {
    loading.set(true);
    const offersQuery = query(
      collection(db, 'offers'),
      orderBy('timestamp', 'desc')
    );
    
    unsubscribe = onSnapshot(offersQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        offers.set(data);
        loading.set(false);
      },
      (error) => {
        console.error('Error in offers listener:', error);
        showError('Failed to load offers');
        loading.set(false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up offers listener:', err);
    showError(err.message);
    loading.set(false);
    return null;
  }
}

// Add new offer
export async function addOffer(offerData) {
  try {
    loading.set(true);

    // Add timestamp
    const data = {
      ...offerData,
      timestamp: new Date().toISOString(),
      status: OFFER_STATUS.SUBMITTED
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'offers'), data);
    showSuccess('Offer submitted successfully');
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error adding offer:', error);
    showError(error.message || 'Failed to submit offer');
    return null;
  } finally {
    loading.set(false);
  }
}

// Update offer
export async function updateOffer(id, offerData) {
  try {
    loading.set(true);

    // Add timestamp
    const data = {
      ...offerData,
      lastModified: new Date().toISOString()
    };

    // Update in Firestore
    const offerRef = doc(db, 'offers', id);
    await updateDoc(offerRef, data);
    showSuccess('Offer updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating offer:', error);
    showError(error.message || 'Failed to update offer');
    return false;
  } finally {
    loading.set(false);
  }
}

// Delete offer
export async function deleteOffer(id) {
  try {
    loading.set(true);
    await deleteDoc(doc(db, 'offers', id));
    showSuccess('Offer deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting offer:', error);
    showError(error.message || 'Failed to delete offer');
    return false;
  } finally {
    loading.set(false);
  }
}

// Update offer status and allocations
export async function updateOfferStatus(id, status, feedback = null, deliveryAllocations = null) {
  try {
    loading.set(true);

    const updateData = {
      status,
      lastModified: new Date().toISOString()
    };

    if (feedback) {
      updateData.feedback = feedback;
    }

    if (deliveryAllocations) {
      updateData.deliveryAllocations = deliveryAllocations;
    }

    if (status === OFFER_STATUS.APPROVED || status === OFFER_STATUS.REJECTED) {
      updateData.reviewedAt = new Date().toISOString();
    }

    return await updateOffer(id, updateData);
  } catch (error) {
    console.error('Error updating offer status:', error);
    showError(error.message || 'Failed to update offer status');
    return false;
  } finally {
    loading.set(false);
  }
}

// Update delivery allocations
export async function updateDeliveryAllocations(id, allocations) {
  try {
    loading.set(true);

    const updateData = {
      deliveryAllocations: allocations,
      lastModified: new Date().toISOString()
    };

    return await updateOffer(id, updateData);
  } catch (error) {
    console.error('Error updating delivery allocations:', error);
    showError(error.message || 'Failed to update delivery allocations');
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
initializeOffersListener();