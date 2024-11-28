<script>
  import { OFFER_STATUS } from '../../../stores/offers';
  import OfferCard from './OfferCard.svelte';

  export let offers = [];
  export let onStatusUpdate;
  export let onDelete;
  export let loading = false;
  export let searchTerm = '';
  export let statusFilter = 'all';
  export let sortBy = 'newest';

  $: filteredOffers = offers.filter(o => 
    (statusFilter === 'all' || o.status === statusFilter)
  );

  $: sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  $: searchedOffers = searchTerm
    ? sortedOffers.filter(o => 
        o.producerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.products.some(p => 
          p.produceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.variety?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : sortedOffers;
</script>

<div class="space-y-4">
  {#each searchedOffers as offer}
    <OfferCard 
      {offer}
      {onStatusUpdate}
      {onDelete}
      {loading}
    />
  {/each}

  {#if searchedOffers.length === 0}
    <div class="bg-gray-50 rounded-lg p-8 text-center">
      <p class="text-gray-600">No offers found</p>
    </div>
  {/if}
</div>