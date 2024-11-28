<script>
  import { products, addProduct, deleteProduct } from '../../stores/products';
  import { showSuccess, showError } from '../../lib/toast';
  import { productSchema, validateForm } from '../../lib/validation';
  
  let editMode = false;
  let searchTerm = '';
  let loading = false;
  
  let formData = {
    name: '',
    boxSize: ''
  };

  $: filteredProducts = searchTerm
    ? $products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : $products;

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      // Validate form data
      const { isValid, errors } = await validateForm(productSchema, formData);
      if (!isValid) {
        showError(Object.values(errors)[0]);
        return;
      }

      const newProduct = {
        name: formData.name,
        boxSize: formData.boxSize,
        unit: formData.name.toLowerCase().includes('buc') ? 'piece' : 'kg'
      };

      const result = await addProduct(newProduct);
      
      if (result) {
        showSuccess('Product added successfully');
        // Reset form
        formData = {
          name: '',
          boxSize: ''
        };
      } else {
        throw new Error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showError(error.message || 'Failed to add product');
    } finally {
      loading = false;
    }
  }

  async function handleDelete(product) {
    if (!product?.id) {
      console.error('Invalid product ID:', product);
      showError('Cannot delete product: Invalid ID');
      return;
    }

    if (loading) return;

    if (confirm(`Are you sure you want to delete ${product.name}? This action cannot be undone.`)) {
      loading = true;
      try {
        const success = await deleteProduct(product.id);
        if (!success) {
          throw new Error('Failed to delete product');
        }
        showSuccess('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        showError(error.message || 'Failed to delete product');
      } finally {
        loading = false;
      }
    }
  }
</script>

<div class="space-y-6">
  <!-- Add New Product Form -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
    <form on:submit={handleSubmit} class="space-y-4">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label for="productName" class="block text-sm font-medium text-gray-700">
            Product Name
            <span class="text-xs text-gray-500">(include "buc" for pieces)</span>
          </label>
          <input
            id="productName"
            type="text"
            bind:value={formData.name}
            required
            placeholder="e.g., Mere kg or Ananas buc"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        <div>
          <label for="boxSize" class="block text-sm font-medium text-gray-700">Box Size</label>
          <input
            id="boxSize"
            type="text"
            bind:value={formData.boxSize}
            required
            placeholder="e.g., 10"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  </div>

  <!-- Products List -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="mb-4">
      <label for="searchProducts" class="block text-sm font-medium text-gray-700">Search Products</label>
      <input
        id="searchProducts"
        type="text"
        bind:value={searchTerm}
        placeholder="Search by name..."
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      />
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredProducts as product}
        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-medium text-gray-900">{product.name}</h4>
              <p class="text-sm text-gray-600">
                Box Size: {product.boxSize} {product.unit}s/box
              </p>
            </div>
            <button
              on:click={() => handleDelete(product)}
              disabled={loading}
              class="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if filteredProducts.length === 0}
      <div class="text-center text-gray-500 py-4">
        No products found
      </div>
    {/if}
  </div>
</div>