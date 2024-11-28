<script>
  import { navigate } from '../lib/router';
  import { currentUser } from '../stores/users';
  import { signOut } from '../lib/auth';
  import TimeDisplay from './TimeDisplay.svelte';

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }
</script>

<nav class="bg-green-600 text-white p-4">
  <div class="container mx-auto">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-6">
        <h1 class="text-2xl font-bold">FreshPlace</h1>
        {#if $currentUser}
          <div class="flex gap-4">
            <button
              on:click={() => navigate('/')}
              class="hover:text-green-200 transition-colors"
            >
              Dashboard
            </button>
            <button
              on:click={() => navigate('/offers')}
              class="hover:text-green-200 transition-colors"
            >
              Offers
            </button>
            {#if $currentUser.role === 'admin'}
              <button
                on:click={() => navigate('/admin')}
                class="hover:text-green-200 transition-colors"
              >
                Admin
              </button>
            {/if}
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-6">
        <TimeDisplay />
        {#if $currentUser}
          <div class="flex items-center gap-4">
            <span class="text-sm">Welcome, {$currentUser.name}</span>
            {#if $currentUser.role === 'producer'}
              <button
                on:click={() => navigate('/profile')}
                class="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition-colors"
              >
                My Profile
              </button>
            {/if}
            <button
              on:click={handleLogout}
              class="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>