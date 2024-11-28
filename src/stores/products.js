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

// Create store
export const products = createStore([]);
export const loading = writable(false);

// Initialize products collection listener
let unsubscribe;

export function initializeProductsListener() {
  if (unsubscribe) {
    unsubscribe();
  }

  try {
    loading.set(true);
    const productsQuery = query(
      collection(db, 'products'),
      orderBy('name', 'asc')
    );
    
    unsubscribe = onSnapshot(productsQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        products.set(data);
        loading.set(false);
      },
      (error) => {
        console.error('Error in products listener:', error);
        showError('Failed to load products');
        loading.set(false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error setting up products listener:', err);
    showError(err.message);
    loading.set(false);
    return null;
  }
}

// Add new product
export async function addProduct(productData) {
  try {
    loading.set(true);

    // Add timestamp
    const data = {
      ...productData,
      createdAt: new Date().toISOString()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'products'), data);
    showSuccess('Product added successfully');
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error adding product:', error);
    showError(error.message || 'Failed to add product');
    return null;
  } finally {
    loading.set(false);
  }
}

// Update product
export async function updateProduct(id, productData) {
  try {
    loading.set(true);

    // Add timestamp
    const data = {
      ...productData,
      updatedAt: new Date().toISOString()
    };

    // Update in Firestore
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, data);
    showSuccess('Product updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    showError(error.message || 'Failed to update product');
    return false;
  } finally {
    loading.set(false);
  }
}

// Delete product
export async function deleteProduct(id) {
  try {
    loading.set(true);
    await deleteDoc(doc(db, 'products', id));
    showSuccess('Product deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    showError(error.message || 'Failed to delete product');
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
initializeProductsListener();