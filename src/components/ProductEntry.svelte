<script>
  import { DAYS_OF_WEEK } from '../lib/dateUtils';

  export let product;
  export let weekDates;
  export let authorizedProductsList;

  $: selectedProduct = authorizedProductsList?.find(p => p.id === product.produceName);

  // Ensure empty quantities are treated as 0
  $: {
    for (const day of DAYS_OF_WEEK) {
      if (!product.dailyQuantities[day] || product.dailyQuantities[day] === '') {
        product.dailyQuantities[day] = '0';
      }
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
</script>

<div class="space-y-4">
  <div class="grid md:grid-cols-2 gap-4">
    <div>
      <label for="produceName" class="block text-sm font-medium text-gray-700">
        Product
      </label>
      <select
        id="produceName"
        bind:value={product.produceName}
        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      >
        <option value="">Select a product</option>
        {#each authorizedProductsList as p}
          <option value={p.id}>{p.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="variety" class="block text-sm font-medium text-gray-700">
        Variety
      </label>
      <input
        id="variety"
        type="text"
        bind:value={product.variety}
        placeholder="Enter variety name"
        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  </div>

  <div>
    <label for="price" class="block text-sm font-medium text-gray-700">
      Price per {selectedProduct?.unit || 'unit'} (RON)
      {#if selectedProduct?.boxSize}
        <span class="text-sm font-normal text-gray-500">
          (Box size: {selectedProduct.boxSize})
        </span>
      {/if}
    </label>
    <input
      id="price"
      type="number"
      bind:value={product.price}
      step="0.01"
      min="0"
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      required
    />
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700">
      Daily Quantities
    </label>
    <div class="grid gap-4">
      {#each DAYS_OF_WEEK as day, index}
        <div class="flex items-center">
          <span class="w-48 text-gray-600">
            {day}
            {#if weekDates?.[index]}
              <span class="text-sm text-gray-500">
                ({formatDate(weekDates[index])})
              </span>
            {/if}
          </span>
          <input
            type="number"
            bind:value={product.dailyQuantities[day]}
            placeholder="0"
            min="0"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span class="ml-2 text-gray-500">boxes</span>
        </div>
      {/each}
    </div>
  </div>
</div>