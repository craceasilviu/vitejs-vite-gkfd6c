import Login from './pages/Login.svelte';
import Dashboard from './pages/Dashboard.svelte';
import { isAuthenticated } from './stores/auth';

function guardRoute() {
  let authenticated = false;
  isAuthenticated.subscribe(value => {
    authenticated = value;
  })();
  
  if (!authenticated) {
    return '/login';
  }
  return true;
}

export const routes = {
  '/': {
    component: Dashboard,
    guard: guardRoute
  },
  '/login': Login
};