<script>
  import { OFFER_STATUS } from '../../../stores/offers';

  export let statusFilter = 'all';
  export let sortBy = 'newest';
  export let searchTerm = '';
</script>

<div class="grid md:grid-cols-3 gap-4 mb-6">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
    <select
      bind:value={statusFilter}
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
    >
      <option value="all">All Offers</option>
      <option value={OFFER_STATUS.SUBMITTED}>Submitted</option>
      <option value={OFFER_STATUS.APPROVED}>Approved</option>
      <option value={OFFER_STATUS.REJECTED}>Rejected</option>
      <option value={OFFER_STATUS.NEEDS_REVISION}>Needs Revision</option>
    </select>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
    <select
      bind:value={sortBy}
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
    </select>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Search by producer or product..."
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
    />
  </div>
</div>