<script>
  import { offers, OFFER_STATUS, deleteOffer, updateOffer } from '../stores/offers';
  import { currentUser } from '../stores/users';
  import { showSuccess, showError, showConfirm } from '../lib/toast';
  import MultiProduceForm from '../components/MultiProduceForm.svelte';
  import OfferDetails from '../components/OfferDetails.svelte';

  let expandedOfferId = null;
  let editingOffer = null;
  let loading = false;

  function toggleOfferDetails(offerId) {
    expandedOfferId = expandedOfferId === offerId ? null : offerId;
  }

  function startEdit(offer) {
    if (offer.status !== OFFER_STATUS.SUBMITTED) {
      showError('Only submitted offers can be edited');
      return;
    }
    editingOffer = offer;
  }

  function cancelEdit() {
    editingOffer = null;
  }

  async function handleDelete(offerId) {
    if (loading) return;

    const confirmed = await showConfirm('Are you sure you want to delete this offer?');
    if (!confirmed) return;

    loading = true;
    try {
      const success = await deleteOffer(offerId);
      if (!success) {
        throw new Error('Failed to delete offer');
      }
      expandedOfferId = null;
      editingOffer = null;
      showSuccess('Offer deleted successfully');
    } catch (error) {
      console.error('Error deleting offer:', error);
      showError(error.message || 'Failed to delete offer');
    } finally {
      loading = false;
    }
  }

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

  async function handleSubmit(offerData) {
    if (!editingOffer?.id || loading) return;

    loading = true;
    try {
      const success = await updateOffer(editingOffer.id, {
        ...offerData,
        status: OFFER_STATUS.SUBMITTED,
        lastModified: new Date().toISOString()
      });

      if (!success) {
        throw new Error('Failed to update offer');
      }

      showSuccess('Offer updated successfully');
      editingOffer = null;
    } catch (error) {
      console.error('Error updating offer:', error);
      showError(error.message || 'Failed to update offer');
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if editingOffer}
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">Edit Offer</h2>
        <button
          on:click={cancelEdit}
          class="text-gray-600 hover:text-gray-800"
        >
          Cancel Edit
        </button>
      </div>
      <MultiProduceForm 
        existingOffer={editingOffer} 
        onSubmitCallback={handleSubmit}
      />
    </div>
  {:else if $currentUser?.role === 'producer'}
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Submit New Offer</h2>
      <MultiProduceForm />
    </div>
  {/if}

  <div>
    <h2 class="text-2xl font-semibold mb-4">Available Offers</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $offers as offer}
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
                on:click={() => toggleOfferDetails(offer.id)}
                class="text-gray-600 hover:text-gray-800"
              >
                {expandedOfferId === offer.id ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>

          {#if expandedOfferId === offer.id}
            <OfferDetails 
              {offer}
              {loading}
              onEdit={() => startEdit(offer)}
              onDelete={() => handleDelete(offer.id)}
            />
          {/if}

          <div class="mt-4 pt-4 border-t text-sm text-gray-500">
            <div>Posted: {new Date(offer.timestamp).toLocaleString()}</div>
            {#if offer.lastModified}
              <div>Last Modified: {new Date(offer.lastModified).toLocaleString()}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>