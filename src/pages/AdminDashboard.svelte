<script>
  import { currentUser } from '../stores/users';
  import { navigate } from '../lib/router';
  import ProductManagement from '../components/admin/ProductManagement.svelte';
  import ProductAuthorization from '../components/admin/ProductAuthorization.svelte';
  import OfferReview from '../components/admin/OfferReview.svelte';
  import SupermarketManagement from '../components/admin/SupermarketManagement.svelte';
  import UserManagement from '../components/admin/UserManagement.svelte';
  import Map from '../components/admin/Map.svelte';
  import Alerts from '../components/admin/Alerts.svelte';
  import NewsManagement from '../components/admin/NewsManagement.svelte';
  
  let activeTab = 'products';

  // Redirect non-admin users
  $: if ($currentUser?.role !== 'admin') {
    navigate('/');
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
    <p class="mt-2 text-gray-600">Manage products, offers, and users</p>
  </div>

  <!-- Tab Navigation -->
  <div class="border-b border-gray-200 mb-6">
    <nav class="-mb-px flex space-x-8">
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'products' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'products'}
      >
        Products
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'auth' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'auth'}
      >
        Product Authorization
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'offers' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'offers'}
      >
        Offer Management
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'supermarkets' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'supermarkets'}
      >
        Supermarkets
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'users' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'users'}
      >
        Users
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'map' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'map'}
      >
        Map
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'alerts' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'alerts'}
      >
        Alerts
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'news' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => activeTab = 'news'}
      >
        News
      </button>
    </nav>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'products'}
    <ProductManagement />
  {:else if activeTab === 'auth'}
    <ProductAuthorization />
  {:else if activeTab === 'offers'}
    <OfferReview />
  {:else if activeTab === 'supermarkets'}
    <SupermarketManagement />
  {:else if activeTab === 'users'}
    <UserManagement />
  {:else if activeTab === 'map'}
    <Map />
  {:else if activeTab === 'alerts'}
    <Alerts />
  {:else if activeTab === 'news'}
    <NewsManagement />
  {/if}
</div>