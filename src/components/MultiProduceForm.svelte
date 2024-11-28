<script>
  import { offers, OFFER_STATUS, addOffer, updateOffer } from '../stores/offers';
  import { currentUser } from '../stores/users';
  import { products } from '../stores/products';
  import { authorizations } from '../stores/authorizations';
  import { getCurrentWeek, getWeekDates, createDayDateMap, DAYS_OF_WEEK } from '../lib/dateUtils';
  import { offerSchema, validateForm } from '../lib/validation';
  import { showSuccess, showError } from '../lib/toast';
  import ProductEntry from './ProductEntry.svelte';
  import LoadingSpinner from '../lib/LoadingSpinner.svelte';

  export let existingOffer = undefined;
  export let onSubmitCallback = undefined;

  let editMode = false;
  let loading = false;
  let weekNumber = getCurrentWeek().next;
  let description = '';
  let offerProducts = [{
    id: crypto.randomUUID(),
    produceName: '',
    variety: '',
    price: '',
    dailyQuantities: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, '']))
  }];

  let weekDates;
  let dayDateMap;
  let authorizedProductsList;
  let weekHasOffer;

  $: weekDates = getWeekDates(weekNumber, getCurrentWeek().year);
  $: dayDateMap = createDayDateMap(weekDates);
  $: authorizedProductsList = $products.filter(product => 
    $authorizations.some(auth => 
      auth.userId === $currentUser?.id && 
      auth.productId === product.id
    )
  );
  $: weekHasOffer = $offers.some(o => 
    o.producerId === $currentUser?.id && 
    o.weekNumber === weekNumber &&
    (!editMode || o.id !== existingOffer?.id)
  );

  // Initialize form if editing existing offer
  $: if (existingOffer) {
    editMode = true;
    weekNumber = existingOffer.weekNumber;
    description = existingOffer.description;
    offerProducts = existingOffer.products.map(p => ({
      ...p,
      id: crypto.randomUUID()
    }));
  }

  function addProduct() {
    offerProducts = [...offerProducts, {
      id: crypto.randomUUID(),
      produceName: '',
      variety: '',
      price: '',
      dailyQuantities: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, '']))
    }];
  }

  function removeProduct(productId) {
    if (offerProducts.length > 1) {
      offerProducts = offerProducts.filter(p => p.id !== productId);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    // Validate all products are authorized
    const unauthorized = offerProducts.some(p => 
      !authorizedProductsList.some(ap => ap.id === p.produceName)
    );
    if (unauthorized) {
      showError('You are not authorized to sell one or more of these products');
      return;
    }

    // Check for existing offers in the same week
    if (weekHasOffer && !editMode) {
      showError('You already have an offer for this week');
      return;
    }

    loading = true;
    try {
      // Validate each product
      for (const product of offerProducts) {
        const { isValid, errors } = await validateForm(offerSchema, product);
        if (!isValid) {
          throw new Error(`Invalid product data: ${Object.values(errors).join(', ')}`);
        }
      }

      const offerData = {
        producerId: $currentUser.id,
        producerName: $currentUser.companyName,
        weekNumber: Number(weekNumber),
        weekDates: weekDates.map(date => date.toISOString()),
        dayDateMap,
        products: offerProducts.map(p => {
          const product = authorizedProductsList.find(ap => ap.id === p.produceName);
          return {
            produceName: p.produceName,
            variety: p.variety,
            unit: product.unit,
            boxSize: product.boxSize,
            price: Number(p.price),
            dailyQuantities: Object.fromEntries(
              Object.entries(p.dailyQuantities).map(([day, qty]) => [
                day,
                Number(qty) || 0
              ])
            ),
            totalQuantity: Object.values(p.dailyQuantities)
              .reduce((sum, qty) => sum + (Number(qty) || 0), 0)
          };
        }),
        description
      };

      if (editMode && existingOffer) {
        if (onSubmitCallback) {
          await onSubmitCallback(offerData);
        } else {
          const success = await updateOffer(existingOffer.id, offerData);
          if (!success) {
            throw new Error('Failed to update offer');
          }
          showSuccess('Offer updated successfully');
        }
      } else {
        const result = await addOffer(offerData);
        if (!result) {
          throw new Error('Failed to submit offer');
        }
        showSuccess('Offer submitted successfully');

        // Reset form after successful submission
        weekNumber = getCurrentWeek().next;
        description = '';
        offerProducts = [{
          id: crypto.randomUUID(),
          produceName: '',
          variety: '',
          price: '',
          dailyQuantities: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, '']))
        }];
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      showError(error.message || 'Failed to save offer');
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="bg-white p-6 rounded-lg shadow-md space-y-6">
  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2">
      Week {weekNumber}
      <span class="font-normal text-gray-500">
        ({weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()})
      </span>
    </label>
    {#if weekHasOffer && !editMode}
      <p class="mt-1 text-red-600 text-sm">
        You already have an offer for this week. You can only submit one offer per week.
      </p>
    {/if}
  </div>

  <div class="space-y-8">
    {#each offerProducts as product (product.id)}
      <div class="relative border-t pt-6 first:border-t-0 first:pt-0">
        {#if offerProducts.length > 1}
          <button
            type="button"
            on:click={() => removeProduct(product.id)}
            class="absolute top-6 right-0 text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        {/if}
        <ProductEntry 
          {product} 
          {weekDates} 
          {authorizedProductsList}
        />
      </div>
    {/each}
  </div>

  <button
    type="button"
    on:click={addProduct}
    class="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-500 transition-colors"
  >
    + Add Another Product
  </button>

  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2" for="description">
      Additional Notes
    </label>
    <textarea
      id="description"
      bind:value={description}
      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      rows="3"
      placeholder="Any special requirements or information..."
    ></textarea>
  </div>

  <button
    type="submit"
    disabled={(!editMode && weekHasOffer) || loading}
    class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {#if loading}
      <LoadingSpinner size={24} />
    {:else}
      {editMode ? 'Update Offer' : 'Submit Offer'}
    {/if}
  </button>
</form>