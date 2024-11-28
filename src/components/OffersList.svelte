<script>
  import { offers } from '../stores/offers';
</script>

<div class="space-y-4">
  {#each $offers as offer}
    <div class="bg-white p-4 rounded-lg shadow-md">
      <div class="flex justify-between items-start">
        <h3 class="text-lg font-semibold text-gray-800">{offer.produceName}</h3>
        <span class="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
          ${offer.price}/{offer.unit}
        </span>
      </div>
      <div class="mt-2 text-gray-600">
        <p>Quantity: {offer.quantity} {offer.unit}</p>
        <p>Available until: {new Date(offer.availability).toLocaleDateString()}</p>
        {#if offer.description}
          <p class="mt-2">{offer.description}</p>
        {/if}
      </div>
      <div class="mt-2 text-sm text-gray-500">
        Posted: {new Date(offer.timestamp).toLocaleString()}
      </div>
    </div>
  {/each}
</div>