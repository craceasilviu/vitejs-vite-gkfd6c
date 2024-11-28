import { writable } from 'svelte/store';
import { setupRealtimeListener } from './firestore';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { showSuccess, showError } from '../lib/toast';

// Local store
export const news = writable([]);
export const loading = writable(false);
export const error = writable(null);

// Initialize news from Firestore with real-time updates
export async function initializeNews() {
  try {
    loading.set(true);
    error.set(null);

    // Create query to sort news by timestamp
    const newsQuery = query(
      collection(db, 'news'),
      orderBy('timestamp', 'desc')
    );

    // Setup real-time listener with query
    setupRealtimeListener('news', news, newsQuery);
    
    return true;
  } catch (err) {
    console.error('Failed to initialize news:', err);
    error.set(err.message);
    return false;
  } finally {
    loading.set(false);
  }
}

// Add news to Firestore
export async function addNews(newsData) {
  try {
    loading.set(true);
    error.set(null);

    const data = {
      ...newsData,
      timestamp: new Date().toISOString(),
      createdBy: newsData.createdBy,
      active: newsData.active ?? true
    };

    const docRef = await addDoc(collection(db, 'news'), data);
    showSuccess('News item added successfully');
    return { id: docRef.id, ...data };
  } catch (err) {
    console.error('Error adding news:', err);
    error.set(err.message);
    showError(err.message || 'Failed to add news');
    return null;
  } finally {
    loading.set(false);
  }
}

// Update news in Firestore
export async function updateNews(id, newsData) {
  try {
    loading.set(true);
    error.set(null);

    const newsRef = doc(db, 'news', id);
    await updateDoc(newsRef, {
      ...newsData,
      updatedAt: new Date().toISOString()
    });

    showSuccess('News item updated successfully');
    return true;
  } catch (err) {
    console.error('Error updating news:', err);
    error.set(err.message);
    showError(err.message || 'Failed to update news');
    return false;
  } finally {
    loading.set(false);
  }
}

// Delete news from Firestore
export async function deleteNews(id) {
  if (!id) {
    showError('Invalid news ID');
    return false;
  }

  try {
    loading.set(true);
    error.set(null);

    const newsRef = doc(db, 'news', id);
    await deleteDoc(newsRef);
    showSuccess('News item deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting news:', err);
    error.set(err.message);
    showError(err.message || 'Failed to delete news');
    return false;
  } finally {
    loading.set(false);
  }
}

// Initialize the store
initializeNews();