<script>
  import { onMount } from 'svelte';
  import { route } from './lib/router';
  import { currentUser } from './stores/users';
  import { migrateData } from './scripts/migrateToFirestore';
  import { Toaster } from 'svelte-french-toast';
  import ErrorBoundary from './lib/ErrorBoundary.svelte';
  import Navbar from './components/Navbar.svelte';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Profile from './pages/Profile.svelte';
  import Offers from './pages/Offers.svelte';
  import AdminDashboard from './pages/AdminDashboard.svelte';
  
  onMount(async () => {
    try {
      await migrateData();
    } catch (error) {
      console.error('Failed to migrate data:', error);
    }
  });
</script>

<ErrorBoundary>
  <Toaster />
  <main class="min-h-screen bg-gray-50">
    {#if $route !== 'login'}
      <Navbar />
    {/if}
    {#if $route === 'login'}
      <Login />
    {:else if $route === 'profile'}
      <Profile />
    {:else if $route === 'offers'}
      <Offers />
    {:else if $route === 'admin'}
      <AdminDashboard />
    {:else}
      <Dashboard />
    {/if}
  </main>
</ErrorBoundary>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>