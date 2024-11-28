<script>
  import { signIn } from '../lib/auth';
  import { currentUser } from '../stores/users';
  import { loginSchema, validateForm } from '../lib/validation';
  import { showError } from '../lib/toast';
  import LoadingSpinner from '../lib/LoadingSpinner.svelte';

  let email = '';
  let password = '';
  let errors = {};
  let isSubmitting = false;

  async function handleLogin(event) {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    errors = {};

    try {
      // Validate form data
      const { isValid, errors: validationErrors } = await validateForm(loginSchema, {
        email,
        password
      });

      if (!isValid) {
        errors = validationErrors;
        showError('Please check the form for errors');
        return;
      }

      await signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to FreshPlace
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Connect with local producers and supermarkets
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit={handleLogin}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border {errors.email ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
          {#if errors.email}
            <p class="mt-1 text-sm text-red-600">{errors.email}</p>
          {/if}
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border {errors.password ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
          {#if errors.password}
            <p class="mt-1 text-sm text-red-600">{errors.password}</p>
          {/if}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>