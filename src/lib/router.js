import { writable, derived } from 'svelte/store';
import { currentUser } from '../stores/users';
import { updateSessionHistory, restoreSession } from '../stores/session';

export const location = writable(window.location.pathname);
export const isNavigating = writable(false);

// Update location on popstate
window.addEventListener('popstate', () => {
  location.set(window.location.pathname);
});

// Navigation function with protection
export function navigate(to) {
  history.pushState(null, '', to);
  location.set(to);
  updateSessionHistory(to);
}

// Protected routes configuration
const protectedRoutes = {
  '/': ['admin', 'producer', 'supermarket'],
  '/profile': ['producer'],
  '/offers': ['admin', 'producer', 'supermarket'],
  '/admin': ['admin']
};

// Public routes
const publicRoutes = ['/login'];

// Route store with protection
export const route = derived(
  [location, currentUser],
  ([$location, $currentUser]) => {
    // Check if route is protected
    const requiredRoles = protectedRoutes[$location];
    
    if (requiredRoles) {
      // Route is protected, check if user is authenticated and has required role
      if (!$currentUser) {
        navigate('/login');
        return 'login';
      }
      
      if (!requiredRoles.includes($currentUser.role)) {
        // User doesn't have required role, redirect to appropriate page
        switch ($currentUser.role) {
          case 'admin':
            navigate('/admin');
            return 'admin';
          case 'producer':
          case 'supermarket':
            navigate('/');
            return 'dashboard';
          default:
            navigate('/login');
            return 'login';
        }
      }
    } else if (!publicRoutes.includes($location) && !$currentUser) {
      // Non-public route accessed without authentication
      navigate('/login');
      return 'login';
    }

    // Route mapping
    switch ($location) {
      case '/login':
        // Redirect authenticated users from login page
        if ($currentUser) {
          // Try to restore last session
          if (!restoreSession()) {
            // If no session to restore, redirect based on role
            switch ($currentUser.role) {
              case 'admin':
                navigate('/admin');
                return 'admin';
              default:
                navigate('/');
                return 'dashboard';
            }
          }
        }
        return 'login';
      case '/profile':
        return 'profile';
      case '/offers':
        return 'offers';
      case '/admin':
        return 'admin';
      default:
        return 'dashboard';
    }
  }
);

// Initialize route on page load
if (typeof window !== 'undefined') {
  location.set(window.location.pathname);
}