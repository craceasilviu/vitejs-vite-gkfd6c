<script>
  import { offers, OFFER_STATUS, updateOfferStatus, deleteOffer } from '../../stores/offers';
  import { showSuccess, showError } from '../../lib/toast';
  import Filters from './OfferReview/Filters.svelte';
  import OfferList from './OfferReview/OfferList.svelte';

  let statusFilter = 'all';
  let sortBy = 'newest';
  let searchTerm = '';
  let loading = false;

  async function handleStatusUpdate(offerId, status, feedback = null, allocations = null) {
    if (loading) return;
    loading = true;

    try {
      const success = await updateOfferStatus(offerId, status, feedback, allocations);
      if (!success) {
        throw new Error('Failed to update offer status');
      }
      showSuccess(`Offer ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating offer status:', error);
      showError(error.message || 'Failed to update offer status');
    } finally {
      loading = false;
    }
  }

  async function handleDelete(offerId) {
    if (loading) return;
    loading = true;

    try {
      const success = await deleteOffer(offerId);
      if (!success) {
        throw new Error('Failed to delete offer');
      }
      showSuccess('Offer deleted successfully');
    } catch (error) {
      console.error('Error deleting offer:', error);
      showError(error.message || 'Failed to delete offer');
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <Filters 
    bind:statusFilter
    bind:sortBy
    bind:searchTerm
  />

  <div class="mb-4 text-sm text-gray-600">
    Total Offers: {$offers.length}
  </div>

  <OfferList 
    offers={$offers}
    {statusFilter}
    {sortBy}
    {searchTerm}
    {loading}
    onStatusUpdate={handleStatusUpdate}
    onDelete={handleDelete}
  />
</div>