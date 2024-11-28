<script>
  import { users } from '../../stores/users';
  import { products } from '../../stores/products';
  import { authorizations, addAuthorization, removeAuthorization } from '../../stores/authorizations';
  import { showSuccess, showError } from '../../lib/toast';
  import LoadingSpinner from '../../lib/LoadingSpinner.svelte';
  
  let selectedProducer = null;
  let searchTerm = '';
  let loading = false;

  $: producers = $users.filter(user => user.role === 'producer');

  $: filteredProducers = searchTerm
    ? producers.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : producers;

  function isAuthorized(userId, productId) {
    return $authorizations.some(auth => 
      auth.userId === userId && auth.productId === productId
    );
  }

  async function toggleAuthorization(producer, productId) {
    if (!producer?.id || !productId || loading) return;

    loading = true;
    try {
      if (isAuthorized(producer.id, productId)) {
        await removeAuthorization(producer.id, productId);
      } else {
        await addAuthorization(producer.id, productId);
      }
    } catch (error) {
      console.error('Error updating authorization:', error);
      showError(error.message || 'Failed to update authorization');
    } finally {
      loading = false;
    }
  }

  function selectProducer(producer) {
    selectedProducer = producer;
  }

  function getAuthorizedCount(producer) {
    return $authorizations.filter(auth => auth.userId === producer.id).length;
  }
</script>

<div class="grid md:grid-cols-3 gap-6">
  <!-- Producers List -->
  <div class="md:col-span-1 bg-white rounded-lg shadow-md p-6">
    <div class="mb-4">
      <label for="producerSearch" class="block text-sm font-medium text-gray-700">Search Producers</label>
      <input
        type="text"
        id="producerSearch"
        placeholder="Search by name, company, or email..."
        bind:value={searchTerm}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      />
    </div>

    <div class="space-y-2">
      {#each filteredProducers as producer}
        <button
          on:click={() => selectProducer(producer)}
          class="w-full text-left p-3 rounded-lg {selectedProducer?.id === producer.id ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'} border transition-colors"
        >
          <div class="font-medium text-gray-900">{producer.companyName || producer.name}</div>
          <div class="text-sm text-gray-500">{producer.email}</div>
          <div class="text-xs text-gray-400 mt-1">
            {getAuthorizedCount(producer)} product{getAuthorizedCount(producer) === 1 ? '' : 's'} authorized
          </div>
        </button>
      {/each}

      {#if filteredProducers.length === 0}
        <div class="text-center text-gray-500 py-4">
          No producers found
        </div>
      {/if}
    </div>
  </div>

  <!-- Product Authorization -->
  <div class="md:col-span-2">
    {#if selectedProducer}
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {selectedProducer.companyName || selectedProducer.name}
          </h2>
          <p class="text-gray-600">Manage product authorizations</p>
        </div>

        {#if loading}
          <LoadingSpinner />
        {:else}
          <div class="grid md:grid-cols-2 gap-4">
            {#each $products as product}
              <div class="border rounded-lg p-4 {isAuthorized(selectedProducer.id, product.id) ? 'bg-green-50' : ''}">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">{product.name}</h3>
                    <p class="text-sm text-gray-500">
                      Box Size: {product.boxSize} {product.unit}s/box
                    </p>
                  </div>
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAuthorized(selectedProducer.id, product.id)}
                      on:change={() => toggleAuthorization(selectedProducer, product.id)}
                      disabled={loading}
                      class="rounded text-green-600 focus:ring-green-500 h-5 w-5 {loading ? 'opacity-50 cursor-not-allowed' : ''}"
                    />
                  </label>
                </div>
              </div>
            {/each}

            {#if $products.length === 0}
              <div class="col-span-2 text-center text-gray-500 py-4">
                No products available
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="bg-gray-50 rounded-lg p-8 text-center">
        <p class="text-gray-600">Select a producer to manage their product authorizations</p>
      </div>
    {/if}
  </div>
</div>