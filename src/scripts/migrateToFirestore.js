import { 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { showSuccess, showError } from '../lib/toast';

// Check if initial setup is needed
async function needsInitialSetup() {
  try {
    const usersQuery = query(collection(db, 'users'));
    const snapshot = await getDocs(usersQuery);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking initial setup:', error);
    return false;
  }
}

// Initialize database schema
async function initializeSchema() {
  try {
    // Create necessary collections with proper indexes
    const collections = ['users', 'products', 'offers', 'authorizations', 'news'];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`Created ${collectionName} collection`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing schema:', error);
    return false;
  }
}

export async function migrateData() {
  try {
    // Check if we need to perform initial setup
    const setupNeeded = await needsInitialSetup();
    
    if (setupNeeded) {
      console.log('Performing initial database setup...');
      const success = await initializeSchema();
      
      if (success) {
        showSuccess('Database initialized successfully');
      } else {
        throw new Error('Failed to initialize database');
      }
    } else {
      console.log('Database already initialized');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    showError(error.message || 'Migration failed');
    throw error;
  }
}