<script>
  import { users } from '../../../stores/users';
  import { DAYS_OF_WEEK } from '../../../lib/dateUtils';

  export let allocation;
  export let product;
  export let dayDateMap;

  function getWarehouseDetails(warehouseRef) {
    if (!warehouseRef) return null;
    const [supermarketId, warehouseId] = warehouseRef.split(':');
    const supermarket = $users.find(s => s.id === supermarketId);
    return supermarket?.warehouses?.find(w => w.id === warehouseId);
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

<div class="mt-4 space-y-2">
  {#each DAYS_OF_WEEK as day}
    {#if allocation[day]}
      {#each allocation[day].find(p => p.productId === product.produceName)?.allocations || [] as alloc}
        {#if alloc.quantity > 0}
          {@const warehouse = getWarehouseDetails(alloc.warehouseId)}
          {#if warehouse}
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {day}
                    {#if dayDateMap?.[day]}
                      <span class="text-gray-500 ml-1">
                        ({formatDate(dayDateMap[day])})
                      </span>
                    {/if}
                  </p>
                  <p class="text-sm text-gray-600">
                    {warehouse.name}
                    <span class="text-gray-500">
                      ({warehouse.city}, {warehouse.state})
                    </span>
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    Working hours: {warehouse.workingHours.start} - {warehouse.workingHours.end}
                  </p>
                </div>
                <div class="text-sm font-medium text-gray-900">
                  {alloc.quantity} Boxes
                </div>
              </div>
            </div>
          {/if}
        {/if}
      {/each}
    {/if}
  {/each}
</div>