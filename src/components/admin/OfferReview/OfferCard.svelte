<script>
  import { OFFER_STATUS } from '../../../stores/offers';
  import OfferDetails from './OfferDetails.svelte';

  export let offer;
  export let onStatusUpdate;
  export let onDelete;
  export let loading = false;

  let expanded = false;
  let feedbackText = '';

  function getStatusBadgeClass(status) {
    switch (status) {
      case OFFER_STATUS.APPROVED:
        return 'bg-green-100 text-green-800';
      case OFFER_STATUS.REJECTED:
        return 'bg-red-100 text-red-800';
      case OFFER_STATUS.NEEDS_REVISION:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex justify-between items-start mb-4">
    <div>
      <h3 class="text-xl font-semibold text-gray-800">
        Week {offer.weekNumber} Offer
      </h3>
      <p class="text-sm text-gray-600">
        {offer.products.length} product{offer.products.length > 1 ? 's' : ''}
      </p>
      <p class="text-sm text-gray-600">Producer: {offer.producerName}</p>
      {#if offer.weekDates?.[0] && offer.weekDates?.[6]}
        <p class="text-sm text-gray-500">
          {formatDate(offer.weekDates[0])} - {formatDate(offer.weekDates[6])}
        </p>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      <span class={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(offer.status)}`}>
        {offer.status}
      </span>
      <button
        on:click={() => expanded = !expanded}
        class="text-gray-600 hover:text-gray-800"
      >
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>
    </div>
  </div>

  {#if expanded}
    <OfferDetails 
      {offer}
      bind:feedbackText
      {onStatusUpdate}
      {onDelete}
      {loading}
    />
  {/if}

  <div class="mt-4 pt-4 border-t text-sm text-gray-500">
    <div>Posted: {new Date(offer.timestamp).toLocaleString()}</div>
    {#if offer.lastModified}
      <div>Last Modified: {new Date(offer.lastModified).toLocaleString()}</div>
    {/if}
    {#if offer.reviewedAt}
      <div>Last Reviewed: {new Date(offer.reviewedAt).toLocaleString()}</div>
    {/if}
  </div>
</div>