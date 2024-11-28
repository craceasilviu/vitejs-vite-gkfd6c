<script>
  import { currentUser } from '../../stores/users';
  import { navigate } from '../../lib/router';
  import ProductManagement from './ProductManagement.svelte';
  import ProductAuthorization from './ProductAuthorization.svelte';
  import OfferReview from './OfferReview.svelte';
  import SupermarketManagement from './SupermarketManagement.svelte';
  import Map from './Map.svelte';
  
  let activeTab = $state('products');

  $effect(() => {
    if ($currentUser?.role !== 'admin') {
      navigate('/');
    }
  });
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
        onclick={() => activeTab = 'products'}
      >
        Products
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'auth' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        onclick={() => activeTab = 'auth'}
      >
        Product Authorization
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'offers' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        onclick={() => activeTab = 'offers'}
      >
        Offer Management
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'supermarkets' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        onclick={() => activeTab = 'supermarkets'}
      >
        Supermarkets
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'map' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        onclick={() => activeTab = 'map'}
      >
        Map
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
  {:else if activeTab === 'map'}
    <Map />
  {/if}
</div>