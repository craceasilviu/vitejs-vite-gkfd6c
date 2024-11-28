<script>
  import { alerts, ALERT_TYPE, ALERT_STATUS, updateAlertStatus, deleteAlert, checkAllCertificates } from '../../stores/alerts';
  import { users } from '../../stores/users';
  import { format } from 'date-fns';
  import { onMount } from 'svelte';
  import { showSuccess, showError, showInfo } from '../../lib/toast';

  let statusFilter = 'all';
  let typeFilter = 'all';
  let sortBy = 'newest';
  let loading = false;

  $: filteredAlerts = $alerts
    .filter(alert => 
      (statusFilter === 'all' || alert.status === statusFilter) &&
      (typeFilter === 'all' || alert.type === typeFilter)
    )
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  onMount(async () => {
    // Check for certificate expiration alerts when component mounts
    await refreshCertificateAlerts();
  });

  function getUserDetails(userId) {
    return $users.find(u => u.id === userId);
  }

  function getAlertTypeClass(type) {
    switch (type) {
      case ALERT_TYPE.ERROR:
        return 'bg-red-100 text-red-800';
      case ALERT_TYPE.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case ALERT_STATUS.RESOLVED:
        return 'bg-green-100 text-green-800';
      case ALERT_STATUS.ACKNOWLEDGED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  async function handleStatusUpdate(alertId, newStatus) {
    if (loading) return;
    loading = true;
    try {
      const success = await updateAlertStatus(alertId, newStatus);
      if (!success) {
        throw new Error('Failed to update alert status');
      }
      showSuccess(`Alert ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating alert status:', error);
      showError(error.message || 'Failed to update alert status');
    } finally {
      loading = false;
    }
  }

  async function handleDelete(alertId) {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    if (loading) return;

    loading = true;
    try {
      const success = await deleteAlert(alertId);
      if (!success) {
        throw new Error('Failed to delete alert');
      }
      showSuccess('Alert deleted successfully');
    } catch (error) {
      console.error('Error deleting alert:', error);
      showError(error.message || 'Failed to delete alert');
    } finally {
      loading = false;
    }
  }

  async function refreshCertificateAlerts() {
    if (loading) return;
    loading = true;
    try {
      if (!$users || $users.length === 0) {
        showInfo('No users found to check certificates');
        return;
      }

      const producers = $users.filter(u => u.role === 'producer');
      if (producers.length === 0) {
        showInfo('No producers found to check certificates');
        return;
      }

      const alertsCreated = await checkAllCertificates($users);
      if (alertsCreated > 0) {
        showSuccess(`Created ${alertsCreated} new alert${alertsCreated === 1 ? '' : 's'} for expiring certificates`);
      } else {
        showInfo('No new expiring certificates found');
      }
    } catch (error) {
      console.error('Error checking certificates:', error);
      showError(error.message || 'Failed to check certificates');
    } finally {
      loading = false;
    }
  }
</script>

<!-- Rest of the template code remains exactly the same -->
<div class="space-y-6">
  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">System Alerts</h2>
      <button
        on:click={refreshCertificateAlerts}
        disabled={loading}
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Check Certificates'}
      </button>
    </div>
    
    <div class="grid md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          bind:value={statusFilter}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="all">All Statuses</option>
          <option value={ALERT_STATUS.NEW}>New</option>
          <option value={ALERT_STATUS.ACKNOWLEDGED}>Acknowledged</option>
          <option value={ALERT_STATUS.RESOLVED}>Resolved</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          bind:value={typeFilter}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="all">All Types</option>
          <option value={ALERT_TYPE.INFO}>Info</option>
          <option value={ALERT_TYPE.WARNING}>Warning</option>
          <option value={ALERT_TYPE.ERROR}>Error</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select
          bind:value={sortBy}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Alerts List -->
  <div class="space-y-4">
    {#each filteredAlerts as alert}
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class={`px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeClass(alert.type)}`}>
                {alert.type}
              </span>
              <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(alert.status)}`}>
                {alert.status}
              </span>
              <span class="text-sm text-gray-500">
                {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{alert.title}</h3>
            <p class="mt-1 text-gray-600">{alert.message}</p>
            {#if alert.userId}
              {@const user = getUserDetails(alert.userId)}
              {#if user}
                <p class="mt-2 text-sm text-gray-500">
                  Producer: {user.companyName}
                </p>
              {/if}
            {/if}
          </div>
          
          <div class="flex items-center gap-2">
            {#if alert.status === ALERT_STATUS.NEW}
              <button
                on:click={() => handleStatusUpdate(alert.id, ALERT_STATUS.ACKNOWLEDGED)}
                disabled={loading}
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Acknowledge
              </button>
            {:else if alert.status === ALERT_STATUS.ACKNOWLEDGED}
              <button
                on:click={() => handleStatusUpdate(alert.id, ALERT_STATUS.RESOLVED)}
                disabled={loading}
                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Resolve
              </button>
            {/if}
            <button
              on:click={() => handleDelete(alert.id)}
              disabled={loading}
              class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/each}

    {#if filteredAlerts.length === 0}
      <div class="bg-gray-50 rounded-lg p-8 text-center">
        <p class="text-gray-600">No alerts found</p>
      </div>
    {/if}
  </div>
</div>