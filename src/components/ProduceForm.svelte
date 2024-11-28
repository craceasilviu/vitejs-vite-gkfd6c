<script>
  import { offers, OFFER_STATUS } from '../stores/offers';
  import { currentUser } from '../stores/users';
  import { allProducts } from '../stores/products';
  import { getCurrentWeek, getWeekDates, DAYS_OF_WEEK } from '../lib/dateUtils';

  // Define props using $props() in runes mode
  const { existingOffer, onSubmitCallback } = $props();

  let editMode = $state(false);
  let formData = $state({
    produceName: '',
    variety: '',
    price: '',
    weekNumber: getCurrentWeek().next,
    dailyQuantities: {
      Sunday: '',
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: '',
      Saturday: ''
    },
    description: ''
  });

  $effect(() => {
    if (existingOffer) {
      formData = { ...existingOffer };
      editMode = true;
    }
  });

  let authorizedProducts = $derived(
    allProducts.filter(product => $currentUser?.authorizedProducts?.includes(product.id))
  );

  let selectedProduct = $derived(
    allProducts.find(product => product.id === formData.produceName)
  );

  let weekDates = $derived(
    formData.weekNumber ? getWeekDates(formData.weekNumber) : []
  );

  let existingOfferForWeek = $derived(
    !editMode && formData.weekNumber ? 
    $offers.find(o => 
      o.producerId === $currentUser?.id && 
      o.produceName === formData.produceName &&
      o.weekNumber === formData.weekNumber
    ) : null
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!$currentUser?.authorizedProducts?.includes(formData.produceName)) {
      alert('You are not authorized to sell this product');
      return;
    }

    if (existingOfferForWeek && !editMode) {
      alert('You already have an offer for this product in the selected week');
      return;
    }

    // Calculate total quantity
    const totalQuantity = Object.values(formData.dailyQuantities)
      .reduce((sum, qty) => sum + (Number(qty) || 0), 0);

    const offerData = {
      id: editMode ? existingOffer.id : Date.now(),
      producerId: $currentUser.id,
      producerName: $currentUser.companyName,
      produceName: formData.produceName,
      variety: formData.variety,
      unit: selectedProduct.unit,
      boxSize: selectedProduct.boxSize,
      price: Number(formData.price),
      weekNumber: Number(formData.weekNumber),
      dailyQuantities: { ...formData.dailyQuantities },
      totalQuantity,
      description: formData.description,
      status: editMode ? existingOffer.status : OFFER_STATUS.SUBMITTED,
      timestamp: editMode ? existingOffer.timestamp : new Date().toISOString(),
      lastModified: editMode ? new Date().toISOString() : null
    };

    offers.update(current => {
      if (editMode) {
        return current.map(o => o.id === existingOffer.id ? offerData : o);
      }
      return [...current, offerData];
    });

    // Call the callback if provided
    if (onSubmitCallback) {
      onSubmitCallback();
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
</script>

<form onsubmit={handleSubmit} class="bg-white p-6 rounded-lg shadow-md">
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2" for="produceName">
      Product
    </label>
    <select
      id="produceName"
      bind:value={formData.produceName}
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      required
    >
      <option value="">Select a product</option>
      {#each authorizedProducts as product}
        <option value={product.id}>{product.name}</option>
      {/each}
    </select>
  </div>

  {#if selectedProduct?.varieties?.length}
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="variety">
        Variety
      </label>
      <select
        id="variety"
        bind:value={formData.variety}
        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      >
        <option value="">Select a variety</option>
        {#each selectedProduct.varieties as variety}
          <option value={variety}>{variety}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2" for="price">
      Price per {selectedProduct?.unit || 'unit'} (USD)
      {#if selectedProduct?.boxSize}
        <span class="text-sm font-normal text-gray-500">
          (Box size: {selectedProduct.boxSize})
        </span>
      {/if}
    </label>
    <input
      type="number"
      id="price"
      bind:value={formData.price}
      step="0.01"
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      required
    />
  </div>

  <div class="mb-6">
    <label class="block text-gray-700 text-sm font-bold mb-2">
      Week {formData.weekNumber} Daily Quantities
      <span class="font-normal text-gray-500">
        ({formatDate(weekDates[0])} - {formatDate(weekDates[6])})
      </span>
    </label>
    <div class="grid gap-4">
      {#each DAYS_OF_WEEK as day}
        <div class="flex items-center">
          <span class="w-32 text-gray-600">{day}:</span>
          <input
            type="number"
            bind:value={formData.dailyQuantities[day]}
            placeholder="0"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <span class="ml-2 text-gray-500">{selectedProduct?.unit || 'units'}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2" for="description">
      Additional Notes
    </label>
    <textarea
      id="description"
      bind:value={formData.description}
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      rows="3"
      placeholder="Any special requirements or information..."
    ></textarea>
  </div>

  <button
    type="submit"
    class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
  >
    {editMode ? 'Update Offer' : 'Submit Offer'}
  </button>
</form>