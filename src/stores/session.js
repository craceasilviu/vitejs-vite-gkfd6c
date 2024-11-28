import { writable } from 'svelte/store';
import { navigate } from '../lib/router';
import { currentUser } from './users';

// Create session store
export const sessionHistory = writable({
  lastPath: '/',
  timestamp: null
});

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  const savedSession = localStorage.getItem('session');
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      sessionHistory.set(session);
    } catch (error) {
      console.error('Failed to parse saved session:', error);
    }
  }
}

// Subscribe to changes and save to localStorage
sessionHistory.subscribe(session => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('session', JSON.stringify(session));
  }
});

// Update session history
export function updateSessionHistory(path) {
  if (path === '/login') return; // Don't store login page
  
  sessionHistory.set({
    lastPath: path,
    timestamp: new Date().toISOString()
  });
}

// Restore last session
export function restoreSession() {
  let session;
  sessionHistory.subscribe(value => session = value)();

  if (session?.lastPath && session.lastPath !== '/login') {
    navigate(session.lastPath);
    return true;
  }
  return false;
}

// Clear session
export function clearSession() {
  sessionHistory.set({
    lastPath: '/',
    timestamp: null
  });
  if (typeof window !== 'undefined') {
    localStorage.removeItem('session');
  }
}