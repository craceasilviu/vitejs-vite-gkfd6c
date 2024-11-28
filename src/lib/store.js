import { writable } from 'svelte/store';

// Create a store with basic CRUD operations
export function createStore(initialValue) {
  const { subscribe, set, update } = writable(initialValue);

  return {
    subscribe,
    set,
    update,
    // Helper method to get current value
    get current() {
      let value;
      subscribe(v => value = v)();
      return value;
    }
  };
}

// Create a store with persistence
export function createPersistedStore(key, initialValue) {
  // Try to load from localStorage
  let stored;
  try {
    stored = localStorage.getItem(key);
    if (stored) {
      initialValue = JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`Failed to load persisted store ${key}:`, e);
  }

  const store = createStore(initialValue);

  // Subscribe to changes and persist
  store.subscribe(value => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to persist store ${key}:`, e);
    }
  });

  return store;
}