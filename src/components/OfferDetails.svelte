<script>
  import { DAYS_OF_WEEK } from '../lib/dateUtils';
  import { products } from '../stores/products';
  import { currentUser } from '../stores/users';
  import WarehouseAllocation from './WarehouseAllocation.svelte';

  export let offer;
  export let onEdit = () => {};
  export let onDelete = () => {};
  export let loading = false;

  function getProductName(productId) {
    const product = $products.find(p => p.id === productId);
    return product ? product.name : productId;
  }

  function getProductDetails(productId) {
    return $products.find(p => p.id === productId);
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  $: canModify = $currentUser?.id === offer.producerId && offer.status === 'submitted';
</script>

<div class="mt-4 space-y-6">
  {#each offer.products as product}
    {@const productDetails = getProductDetails(product.produceName)}
    <div class="border-t pt-4">
      <h4 class="font-medium text-gray-800">
        {getProductName(product.produceName)}
        {#if product.variety}
          <span class="text-sm text-gray-600 ml-2">({product.variety})</span>
        {/if}
      </h4>
      
      <div class="mt-2 space-y-2 text-sm">
        <div class="flex justify-between items-center">
          <span>Price:</span>
          <div class="text-right">
            <span class="font-medium">
              {product.price} RON/{product.unit}
            </span>
            {#if productDetails?.boxSize}
              <div class="text-xs text-gray-500">
                Box size: {productDetails.boxSize} {product.unit}s/box
              </div>
            {/if}
          </div>
        </div>
        <p class="flex justify-between">
          <span>Total Quantity:</span>
          <span class="font-medium">
            {product.totalQuantity} Boxes
          </span>
        </p>
        
        <div class="mt-2">
          <p class="font-medium mb-1">Daily Quantities:</p>
          {#each DAYS_OF_WEEK as day}
            <div class="flex justify-between text-sm">
              <span class="text-gray-700">
                {day}
                {#if offer.dayDateMap?.[day]}
                  <span class="text-gray-500 ml-1">
                    ({formatDate(offer.dayDateMap[day])})
                  </span>
                {/if}
              </span>
              <span>
                {product.dailyQuantities[day]} Boxes
              </span>
            </div>
          {/each}
        </div>

        {#if offer.deliveryAllocations}
          <div class="mt-4">
            <h5 class="font-medium text-gray-700 mb-2">Delivery Allocations:</h5>
            <WarehouseAllocation 
              allocation={offer.deliveryAllocations}
              {product}
              dayDateMap={offer.dayDateMap}
            />
          </div>
        {/if}
      </div>
    </div>
  {/each}

  {#if offer.description}
    <div class="border-t pt-4">
      <p class="text-sm font-medium text-gray-700">Additional Notes:</p>
      <p class="mt-1 text-gray-600">{offer.description}</p>
    </div>
  {/if}

  {#if offer.feedback}
    <div class="p-3 bg-yellow-50 rounded-lg">
      <p class="text-sm font-medium text-yellow-800">Admin Feedback:</p>
      <p class="text-sm text-yellow-700 mt-1">{offer.feedback}</p>
    </div>
  {/if}

  {#if canModify}
    <div class="flex justify-end gap-3">
      <button
        on:click={onDelete}
        disabled={loading}
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
      <button
        on:click={onEdit}
        disabled={loading}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Edit
      </button>
    </div>
  {/if}
</div>