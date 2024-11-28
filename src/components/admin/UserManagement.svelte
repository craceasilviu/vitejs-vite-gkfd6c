<script>
  import { 
    collection, 
    addDoc, 
    deleteDoc,
    doc 
  } from 'firebase/firestore';
  import { db } from '../../lib/firebase';
  import { users } from '../../stores/users';
  import { showSuccess, showError } from '../../lib/toast';
  
  let editMode = false;
  let searchTerm = '';
  let loading = false;
  
  let formData = {
    email: '',
    password: '',
    name: '',
    role: 'producer',
    companyName: '',
    vatNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      lat: null,
      lng: null
    }
  };

  $: filteredUsers = searchTerm
    ? $users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : $users;

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      // Convert coordinates to numbers
      const lat = formData.address.lat ? Number(formData.address.lat) : null;
      const lng = formData.address.lng ? Number(formData.address.lng) : null;

      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        companyName: formData.role !== 'admin' ? formData.companyName : null,
        vatNumber: formData.role !== 'admin' ? formData.vatNumber : null,
        address: formData.role !== 'admin' ? {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          country: formData.address.country,
          postalCode: formData.address.postalCode,
          lat,
          lng
        } : null,
        authorizedProducts: formData.role === 'producer' ? [] : null,
        warehouses: formData.role === 'supermarket' ? [] : null,
        certifications: formData.role === 'producer' ? {
          globalGap: { status: 'pending' },
          grasp: { status: 'pending' },
          eco: { status: 'pending' }
        } : null,
        createdAt: new Date().toISOString()
      };

      // Remove null values to avoid Firestore errors
      Object.keys(userData).forEach(key => {
        if (userData[key] === null) {
          delete userData[key];
        }
      });

      if (userData.address) {
        Object.keys(userData.address).forEach(key => {
          if (userData.address[key] === null) {
            delete userData.address[key];
          }
        });
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'users'), userData);
      
      // Update local store with the new user including the Firestore ID
      users.update(current => [...current, { ...userData, id: docRef.id }]);

      // Reset form
      formData = {
        email: '',
        password: '',
        name: '',
        role: 'producer',
        companyName: '',
        vatNumber: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          lat: null,
          lng: null
        }
      };
      editMode = false;
      showSuccess('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      showError(error.message || 'Failed to create user');
    } finally {
      loading = false;
    }
  }

  function startEdit() {
    editMode = true;
  }

  function cancelEdit() {
    editMode = false;
    formData = {
      email: '',
      password: '',
      name: '',
      role: 'producer',
      companyName: '',
      vatNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        lat: null,
        lng: null
      }
    };
  }

  async function handleDelete(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    if (loading) return;

    loading = true;
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Update local store
      users.update(current => current.filter(u => u.id !== userId));
      showSuccess('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(error.message || 'Failed to delete user');
    } finally {
      loading = false;
    }
  }
</script>

<!-- User List -->
<div class="space-y-6">
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Users</h2>
        <p class="text-sm text-gray-500">Manage system users</p>
      </div>
      <button
        on:click={startEdit}
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Add User
      </button>
    </div>

    <div class="mb-4">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search users..."
        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
      />
    </div>

    <div class="space-y-4">
      {#each filteredUsers as user}
        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-gray-900">{user.name}</h3>
              <p class="text-sm text-gray-600">{user.email}</p>
              <p class="text-sm text-gray-500">
                Role: {user.role}
                {#if user.companyName}
                  · Company: {user.companyName}
                {/if}
              </p>
            </div>
            <button
              on:click={() => handleDelete(user.id)}
              disabled={loading}
              class="text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Add/Edit User Form -->
  {#if editMode}
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Add New User</h2>
        <button
          on:click={cancelEdit}
          class="text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      <form on:submit={handleSubmit} class="space-y-6">
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
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="role"
              bind:value={formData.role}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="producer">Producer</option>
              <option value="supermarket">Supermarket</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {#if formData.role !== 'admin'}
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

            <div class="col-span-2">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Address</h3>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label for="street" class="block text-sm font-medium text-gray-700">Street</label>
                  <input
                    id="street"
                    type="text"
                    bind:value={formData.address.street}
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700">City</label>
                  <input
                    id="city"
                    type="text"
                    bind:value={formData.address.city}
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-gray-700">State</label>
                  <input
                    id="state"
                    type="text"
                    bind:value={formData.address.state}
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    id="country"
                    type="text"
                    bind:value={formData.address.country}
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    id="postalCode"
                    type="text"
                    bind:value={formData.address.postalCode}
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label for="coordinates" class="block text-sm font-medium text-gray-700">Coordinates</label>
                  <div class="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      bind:value={formData.address.lat}
                      required
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      bind:value={formData.address.lng}
                      required
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>