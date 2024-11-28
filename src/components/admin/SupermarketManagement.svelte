<script>
  import { 
    collection, 
    addDoc, 
    updateDoc,
    deleteDoc,
    doc 
  } from 'firebase/firestore';
  import { db } from '../../lib/firebase';
  import { users } from '../../stores/users';
  import { showSuccess, showError } from '../../lib/toast';
  
  let selectedSupermarket = null;
  let searchTerm = '';
  let editMode = false;
  let loading = false;
  
  let formData = {
    id: null,
    email: '',
    password: '',
    name: '',
    companyName: '',
    vatNumber: '',
    role: 'supermarket',
    warehouses: [{
      id: crypto.randomUUID(),
      name: '',
      gln: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      lat: null,
      lng: null,
      workingHours: {
        start: '08:00',
        end: '10:00',
        timezone: 'Europe/Bucharest'
      }
    }]
  };

  $: supermarkets = $users.filter(user => user.role === 'supermarket');

  $: filteredSupermarkets = searchTerm
    ? supermarkets.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : supermarkets;

  function addWarehouse() {
    formData.warehouses = [...formData.warehouses, {
      id: crypto.randomUUID(),
      name: '',
      gln: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      lat: null,
      lng: null,
      workingHours: {
        start: '08:00',
        end: '10:00',
        timezone: 'Europe/Bucharest'
      }
    }];
  }

  function removeWarehouse(warehouseId) {
    if (formData.warehouses.length > 1) {
      formData.warehouses = formData.warehouses.filter(w => w.id !== warehouseId);
    }
  }

  function selectSupermarket(supermarket) {
    selectedSupermarket = supermarket;
    formData = {
      id: supermarket.id,
      email: supermarket.email,
      password: supermarket.password,
      name: supermarket.name,
      companyName: supermarket.companyName || '',
      vatNumber: supermarket.vatNumber || '',
      role: 'supermarket',
      warehouses: supermarket.warehouses || [{
        id: crypto.randomUUID(),
        name: '',
        gln: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        lat: null,
        lng: null,
        workingHours: {
          start: '08:00',
          end: '10:00',
          timezone: 'Europe/Bucharest'
        }
      }]
    };
    editMode = false;
  }

  function startEdit() {
    editMode = true;
  }

  function cancelEdit() {
    if (selectedSupermarket) {
      selectSupermarket(selectedSupermarket);
    } else {
      editMode = false;
      formData = {
        id: null,
        email: '',
        password: '',
        name: '',
        companyName: '',
        vatNumber: '',
        role: 'supermarket',
        warehouses: [{
          id: crypto.randomUUID(),
          name: '',
          gln: '',
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          lat: null,
          lng: null,
          workingHours: {
            start: '08:00',
            end: '10:00',
            timezone: 'Europe/Bucharest'
          }
        }]
      };
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      // Convert coordinates to numbers
      const warehousesWithCoords = formData.warehouses.map(w => ({
        ...w,
        lat: w.lat ? Number(w.lat) : null,
        lng: w.lng ? Number(w.lng) : null
      }));

      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: formData.companyName,
        vatNumber: formData.vatNumber,
        role: 'supermarket',
        warehouses: warehousesWithCoords,
        updatedAt: new Date().toISOString()
      };

      if (formData.id) {
        // Update existing supermarket in Firestore
        const userRef = doc(db, 'users', formData.id);
        await updateDoc(userRef, userData);
        
        // Update local store
        users.update(currentUsers =>
          currentUsers.map(u =>
            u.id === formData.id ? { ...u, ...userData } : u
          )
        );
        showSuccess('Supermarket updated successfully');
      } else {
        // Add new supermarket to Firestore
        userData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'users'), userData);
        
        // Update local store with the new user including the Firestore ID
        users.update(currentUsers => [...currentUsers, { ...userData, id: docRef.id }]);
        showSuccess('Supermarket created successfully');
      }

      editMode = false;
      if (!selectedSupermarket) {
        cancelEdit();
      }
    } catch (error) {
      console.error('Error saving supermarket:', error);
      showError(error.message || 'Failed to save supermarket');
    } finally {
      loading = false;
    }
  }

  async function handleDelete(supermarketId) {
    if (!confirm('Are you sure you want to delete this supermarket?')) return;
    if (loading) return;

    loading = true;
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', supermarketId));
      
      // Update local store
      users.update(current => current.filter(u => u.id !== supermarketId));
      
      // Reset selection if the deleted supermarket was selected
      if (selectedSupermarket?.id === supermarketId) {
        selectedSupermarket = null;
        editMode = false;
      }
      showSuccess('Supermarket deleted successfully');
    } catch (error) {
      console.error('Error deleting supermarket:', error);
      showError(error.message || 'Failed to delete supermarket');
    } finally {
      loading = false;
    }
  }

  function createNew() {
    selectedSupermarket = null;
    cancelEdit();
    editMode = true;
  }
</script>

<div class="grid md:grid-cols-3 gap-6">
  <!-- Supermarkets List -->
  <div class="md:col-span-1 bg-white rounded-lg shadow-md p-6">
    <div class="mb-4">
      <div class="flex justify-between items-center mb-4">
        <label class="block text-sm font-medium text-gray-700">Supermarkets</label>
        <button
          on:click={createNew}
          class="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
        >
          + New
        </button>
      </div>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search supermarkets..."
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      />
    </div>

    <div class="space-y-2">
      {#each filteredSupermarkets as supermarket}
        <button
          on:click={() => selectSupermarket(supermarket)}
          class="w-full text-left p-3 rounded-lg {selectedSupermarket?.id === supermarket.id ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'} border transition-colors"
        >
          <div class="font-medium text-gray-900">{supermarket.companyName || supermarket.name}</div>
          <div class="text-sm text-gray-500">VAT: {supermarket.vatNumber || 'Not set'}</div>
          <div class="text-xs text-gray-400 mt-1">
            {supermarket.warehouses?.length || 0} warehouses
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Supermarket Details/Form -->
  <div class="md:col-span-2">
    {#if editMode || selectedSupermarket}
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {formData.id ? 'Edit Supermarket' : 'New Supermarket'}
          </h2>
          {#if selectedSupermarket && !editMode}
            <div class="flex gap-2">
              <button
                on:click={startEdit}
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Edit
              </button>
              <button
                on:click={() => handleDelete(selectedSupermarket.id)}
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          {/if}
        </div>

        {#if editMode}
          <form on:submit={handleSubmit} class="space-y-6">
            <!-- Basic Information -->
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  bind:value={formData.email}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  type="password"
                  bind:value={formData.password}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Contact Name</label>
                <input
                  id="name"
                  type="text"
                  bind:value={formData.name}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label for="companyName" class="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  bind:value={formData.companyName}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label for="vatNumber" class="block text-sm font-medium text-gray-700">VAT Number</label>
                <input
                  id="vatNumber"
                  type="text"
                  bind:value={formData.vatNumber}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <!-- Warehouses -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900">Warehouses</h3>
                <button
                  type="button"
                  on:click={addWarehouse}
                  class="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200"
                >
                  + Add Warehouse
                </button>
              </div>

              {#each formData.warehouses as warehouse (warehouse.id)}
                <div class="border rounded-lg p-4">
                  {#if formData.warehouses.length > 1}
                    <div class="flex justify-end">
                      <button
                        type="button"
                        on:click={() => removeWarehouse(warehouse.id)}
                        class="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  {/if}

                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Warehouse Name</label>
                      <input
                        type="text"
                        bind:value={warehouse.name}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">GLN (optional)</label>
                      <input
                        type="text"
                        bind:value={warehouse.gln}
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Street</label>
                      <input
                        type="text"
                        bind:value={warehouse.street}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        bind:value={warehouse.city}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">State/Province</label>
                      <input
                        type="text"
                        bind:value={warehouse.state}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        bind:value={warehouse.country}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Postal Code</label>
                      <input
                        type="text"
                        bind:value={warehouse.postalCode}
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Coordinates</label>
                      <div class="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          bind:value={warehouse.lat}
                          required
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          bind:value={warehouse.lng}
                          required
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-sm font-medium text-gray-700">Working Hours</label>
                      <div class="grid grid-cols-2 gap-4 mt-1">
                        <div>
                          <label class="block text-xs text-gray-500">Start Time</label>
                          <input
                            type="time"
                            bind:value={warehouse.workingHours.start}
                            required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label class="block text-xs text-gray-500">End Time</label>
                          <input
                            type="time"
                            bind:value={warehouse.workingHours.end}
                            required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <div class="flex justify-end gap-3">
              <button
                type="button"
                on:click={cancelEdit}
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : formData.id ? 'Update' : 'Create'} Supermarket
              </button>
            </div>
          </form>
        {:else}
          <!-- View Mode -->
          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <p class="mt-1 text-gray-900">{selectedSupermarket.email}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Contact Name</label>
                <p class="mt-1 text-gray-900">{selectedSupermarket.name}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Company Name</label>
                <p class="mt-1 text-gray-900">{selectedSupermarket.companyName || 'Not set'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">VAT Number</label>
                <p class="mt-1 text-gray-900">{selectedSupermarket.vatNumber || 'Not set'}</p>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900">Warehouses</h3>
              {#if selectedSupermarket.warehouses?.length}
                <div class="grid gap-4">
                  {#each selectedSupermarket.warehouses as warehouse}
                    <div class="border rounded-lg p-4">
                      <div class="flex justify-between items-start">
                        <h4 class="font-medium text-gray-900">{warehouse.name}</h4>
                        {#if warehouse.gln}
                          <span class="text-sm text-gray-600">GLN: {warehouse.gln}</span>
                        {/if}
                      </div>
                      <div class="mt-2 grid md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span class="text-gray-600">Address:</span>
                          <p class="text-gray-900">{warehouse.street}</p>
                          <p class="text-gray-900">{warehouse.city}, {warehouse.state} {warehouse.postalCode}</p>
                          <p class="text-gray-900">{warehouse.country}</p>
                        </div>
                        <div>
                          <span class="text-gray-600">Working Hours:</span>
                          <p class="text-gray-900">
                            {warehouse.workingHours.start} - {warehouse.workingHours.end}
                            <span class="text-gray-500 text-xs"> (GMT+2)</span>
                          </p>
                        </div>
                        {#if warehouse.lat && warehouse.lng}
                          <div>
                            <span class="text-gray-600">Coordinates:</span>
                            <p class="text-gray-900">
                              {warehouse.lat}, {warehouse.lng}
                            </p>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-gray-600">No warehouses added yet.</p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="bg-gray-50 rounded-lg p-8 text-center">
        <p class="text-gray-600">Select a supermarket to view details or create a new one</p>
      </div>
    {/if}
  </div>
</div>