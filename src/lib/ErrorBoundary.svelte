<script>
  import { showError } from './toast';
  import { checkOnlineStatus } from './firebase';

  let error = null;
  let isOffline = false;

  // Handle errors in child components
  function handleError(event) {
    error = event.error;
    
    // Check if error is due to network connectivity
    if (!checkOnlineStatus()) {
      isOffline = true;
      showError('You are currently offline. Some features may be limited.');
    } else {
      showError(event.error?.message || 'An unexpected error occurred');
    }
    
    console.error('Error caught by boundary:', event.error);
  }
</script>

<svelte:window on:error={handleError} />

{#if error}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        {isOffline ? 'You are offline' : 'Oops! Something went wrong'}
      </h2>
      <p class="text-gray-600 mb-6">
        {#if isOffline}
          Please check your internet connection and try again.
          Some features may be limited while offline.
        {:else}
          We're sorry, but something unexpected happened. Please try refreshing the page.
        {/if}
      </p>
      <button
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        on:click={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  </div>
{:else}
  <slot />
{/if}