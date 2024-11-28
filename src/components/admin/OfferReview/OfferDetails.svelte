<script>
  import { OFFER_STATUS } from '../../../stores/offers';
  import { products } from '../../../stores/products';
  import { DAYS_OF_WEEK } from '../../../lib/dateUtils';
  import DeliveryAllocation from '../DeliveryAllocation.svelte';
  import WarehouseAllocation from './WarehouseAllocation.svelte';

  export let offer;
  export let feedbackText = '';
  export let onStatusUpdate;
  export let onDelete;
  export let loading = false;

  let showDeliveryAllocation = false;

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

  {#if showDeliveryAllocation}
    <div class="border-t pt-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Delivery Allocation</h3>
      <DeliveryAllocation 
        {offer}
        onSave={async (allocations) => {
          await onStatusUpdate(offer.id, OFFER_STATUS.APPROVED, feedbackText, allocations);
          showDeliveryAllocation = false;
        }}
      />
    </div>
  {:else}
    <div class="border-t pt-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Feedback for Producer
      </label>
      <textarea
        bind:value={feedbackText}
        rows="3"
        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Enter feedback for the producer..."
      ></textarea>

      <div class="flex justify-end gap-3 mt-4">
        <button
          on:click={() => onDelete(offer.id)}
          disabled={loading}
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
        <button
          on:click={() => onStatusUpdate(offer.id, OFFER_STATUS.NEEDS_REVISION, feedbackText)}
          disabled={loading}
          class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
        >
          Request Changes
        </button>
        <button
          on:click={() => onStatusUpdate(offer.id, OFFER_STATUS.REJECTED, feedbackText)}
          disabled={loading}
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Reject
        </button>
        {#if !offer.deliveryAllocations}
          <button
            on:click={() => showDeliveryAllocation = true}
            disabled={loading}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Approve & Allocate
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>