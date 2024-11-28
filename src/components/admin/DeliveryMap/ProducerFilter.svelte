<script>
  import { users } from '../../../stores/users';
  import { offers, OFFER_STATUS } from '../../../stores/offers';

  const { selectedProducer, onProducerSelect } = $props();

  let producers = $derived(
    $users.filter(user => 
      user.role === 'producer' &&
      $offers.some(o => 
        o.producerId === user.id && 
        o.status === OFFER_STATUS.APPROVED
      )
    )
  );
</script>

<div class="bg-white p-4 rounded-lg shadow-md">
  <div class="flex items-center gap-4">
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Filter by Producer
      </label>
      <select
        value={selectedProducer}
        on:change={(e) => onProducerSelect(e.target.value || null)}
        class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      >
        <option value="">All Producers</option>
        {#each producers as producer}
          <option value={producer.id}>{producer.companyName}</option>
        {/each}
      </select>
    </div>
  </div>
</div>