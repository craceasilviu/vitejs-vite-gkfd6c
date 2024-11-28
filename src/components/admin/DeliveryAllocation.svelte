<script>
  import { users } from '../../stores/users';
  import { products } from '../../stores/products';
  import { DAYS_OF_WEEK } from '../../lib/dateUtils';
  import { showSuccess, showError } from '../../lib/toast';

  export let offer;
  export let onSave;
  export let existingAllocations = null;

  let loading = false;
  let allocations = {};

  // Initialize allocations
  $: {
    if (existingAllocations) {
      allocations = { ...existingAllocations };
    } else {
      allocations = Object.fromEntries(
        DAYS_OF_WEEK.map(day => [
          day,
          offer.products.map(product => ({
            productId: product.produceName,
            allocations: []
          }))
        ])
      );
    }
  }

  $: supermarkets = $users.filter(user => user.role === 'supermarket');

  function getProductName(productId) {
    const product = $products.find(p => p.id === productId);
    return product ? product.name : productId;
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function addAllocation(day, productId) {
    const dayAllocations = [...(allocations[day] || [])];
    const productAllocations = dayAllocations.find(p => p.productId === productId);
    
    if (productAllocations) {
      productAllocations.allocations = [
        ...(productAllocations.allocations || []),
        { warehouseId: '', quantity: 0 }
      ];
      
      allocations = {
        ...allocations,
        [day]: dayAllocations
      };
    }
  }

  function removeAllocation(day, productId, index) {
    const dayAllocations = [...(allocations[day] || [])];
    const productAllocations = dayAllocations.find(p => p.productId === productId);
    
    if (productAllocations) {
      productAllocations.allocations = productAllocations.allocations.filter((_, i) => i !== index);
      
      allocations = {
        ...allocations,
        [day]: dayAllocations
      };
    }
  }

  function validateAllocations() {
    for (const day of DAYS_OF_WEEK) {
      for (const product of offer.products) {
        const productAllocations = allocations[day]?.find(p => p.productId === product.produceName);
        if (!productAllocations) continue;

        const totalAllocated = productAllocations.allocations.reduce(
          (sum, alloc) => sum + (Number(alloc.quantity) || 0),
          0
        );

        const availableQuantity = Number(product.dailyQuantities[day]) || 0;

        if (totalAllocated !== availableQuantity) {
          return `Allocation total for ${getProductName(product.produceName)} on ${day} (${totalAllocated}) does not match available quantity (${availableQuantity})`;
        }
      }
    }
    return null;
  }

  async function handleSave() {
    if (loading) return;

    const error = validateAllocations();
    if (error) {
      showError(error);
      return;
    }

    loading = true;
    try {
      await onSave(allocations);
      showSuccess('Allocations saved successfully');
    } catch (error) {
      console.error('Error saving allocations:', error);
      showError(error.message || 'Failed to save allocations');
    } finally {
      loading = false;
    }
  }

  function getWarehouseDetails(warehouseRef) {
    if (!warehouseRef) return null;
    const [supermarketId, warehouseId] = warehouseRef.split(':');
    const supermarket = supermarkets.find(s => s.id === supermarketId);
    return supermarket?.warehouses?.find(w => w.id === warehouseId);
  }

  function getAvailableQuantity(day, productId) {
    const product = offer.products.find(p => p.produceName === productId);
    if (!product) return 0;

    const dailyQuantity = Number(product.dailyQuantities[day]) || 0;
    const productAllocations = allocations[day]?.find(p => p.productId === productId);
    if (!productAllocations) return dailyQuantity;

    const allocated = productAllocations.allocations.reduce(
      (sum, alloc) => sum + (Number(alloc.quantity) || 0),
      0
    );

    return dailyQuantity - allocated;
  }

  function handleWarehouseChange(day, productId, index, value) {
    const dayAllocations = [...(allocations[day] || [])];
    const productAllocations = dayAllocations.find(p => p.productId === productId);
    
    if (productAllocations) {
      productAllocations.allocations = productAllocations.allocations.map((alloc, i) => 
        i === index ? { ...alloc, warehouseId: value } : alloc
      );
      
      allocations = {
        ...allocations,
        [day]: dayAllocations
      };
    }
  }

  function handleQuantityChange(day, productId, index, value) {
    const dayAllocations = [...(allocations[day] || [])];
    const productAllocations = dayAllocations.find(p => p.productId === productId);
    
    if (productAllocations) {
      productAllocations.allocations = productAllocations.allocations.map((alloc, i) => 
        i === index ? { ...alloc, quantity: Number(value) || 0 } : alloc
      );
      
      allocations = {
        ...allocations,
        [day]: dayAllocations
      };
    }
  }
</script>

<div class="space-y-8">
  {#each DAYS_OF_WEEK as day}
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {day}
        {#if offer.dayDateMap?.[day]}
          <span class="text-sm text-gray-500 ml-2">
            ({formatDate(offer.dayDateMap[day])})
          </span>
        {/if}
      </h3>
      
      {#each offer.products as product}
        <div class="mb-6 last:mb-0">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-medium text-gray-800">
              {getProductName(product.produceName)}
              {#if product.variety}
                <span class="text-sm text-gray-600">({product.variety})</span>
              {/if}
            </h4>
            <span class="text-sm text-gray-600">
              Available: {product.dailyQuantities[day]} {product.unit}
            </span>
          </div>

          {#if getAvailableQuantity(day, product.produceName) > 0}
            <button
              type="button"
              on:click={() => addAllocation(day, product.produceName)}
              class="mb-2 text-sm text-green-600 hover:text-green-700"
            >
              + Add Allocation
            </button>
          {/if}

          <div class="space-y-2">
            {#each allocations[day]?.find(p => p.productId === product.produceName)?.allocations || [] as allocation, index}
              <div class="flex gap-4 items-center">
                <div class="flex-grow">
                  <select
                    value={allocation.warehouseId}
                    on:change={(e) => handleWarehouseChange(day, product.produceName, index, e.target.value)}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {#each supermarkets as supermarket}
                      <optgroup label={supermarket.companyName}>
                        {#each supermarket.warehouses as warehouse}
                          <option value={`${supermarket.id}:${warehouse.id}`}>
                            {warehouse.name} ({warehouse.city})
                          </option>
                        {/each}
                      </optgroup>
                    {/each}
                  </select>
                </div>
                <div class="w-32">
                  <input
                    type="number"
                    value={allocation.quantity}
                    on:input={(e) => handleQuantityChange(day, product.produceName, index, e.target.value)}
                    min="0"
                    max={getAvailableQuantity(day, product.produceName) + (Number(allocation.quantity) || 0)}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div class="w-16 text-sm text-gray-500">
                  {product.unit}
                </div>
                <button
                  type="button"
                  on:click={() => removeAllocation(day, product.produceName, index)}
                  class="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/each}

  <div class="flex justify-end">
    <button
      type="button"
      on:click={handleSave}
      disabled={loading}
      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Save Allocations'}
    </button>
  </div>
</div>