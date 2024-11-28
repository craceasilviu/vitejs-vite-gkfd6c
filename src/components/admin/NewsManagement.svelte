<script>
  import { news, addNews, updateNews, deleteNews } from '../../stores/news';
  import { currentUser } from '../../stores/users';
  import { format } from 'date-fns';
  import LoadingSpinner from '../../lib/LoadingSpinner.svelte';
  import RichTextEditor from '../RichTextEditor.svelte';

  let editMode = false;
  let loading = false;
  let selectedNews = null;
  let editor;

  let formData = {
    title: '',
    content: '',
    link: '',
    active: true
  };

  function startEdit(item) {
    selectedNews = item;
    formData = {
      title: item.title,
      content: item.content,
      link: item.link || '',
      active: item.active
    };
    editMode = true;
  }

  function cancelEdit() {
    selectedNews = null;
    formData = {
      title: '',
      content: '',
      link: '',
      active: true
    };
    editMode = false;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    loading = true;
    try {
      const newsData = {
        ...formData,
        createdBy: $currentUser.id
      };

      if (selectedNews) {
        await updateNews(selectedNews.id, newsData);
      } else {
        await addNews(newsData);
      }

      cancelEdit();
    } catch (error) {
      console.error('Error saving news:', error);
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id) {
    if (loading) return;

    loading = true;
    try {
      const success = await deleteNews(id);
      if (success && selectedNews?.id === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    } finally {
      loading = false;
    }
  }

  function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  }

  function handleEditorChange(html) {
    formData.content = html;
  }
</script>

<div class="space-y-6">
  <!-- News Form -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-800">
        {editMode ? 'Edit News' : 'Add News'}
      </h2>
      {#if editMode}
        <button
          on:click={cancelEdit}
          class="text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      {/if}
    </div>

    <form on:submit={handleSubmit} class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input
          id="title"
          type="text"
          bind:value={formData.title}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
        <RichTextEditor 
          bind:this={editor}
          content={formData.content}
          onChange={handleEditorChange}
        />
      </div>

      <div>
        <label for="link" class="block text-sm font-medium text-gray-700">Link (optional)</label>
        <input
          id="link"
          type="url"
          bind:value={formData.link}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
      </div>

      <div class="flex items-center">
        <input
          id="active"
          type="checkbox"
          bind:checked={formData.active}
          class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label for="active" class="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : editMode ? 'Update News' : 'Add News'}
        </button>
      </div>
    </form>
  </div>

  <!-- News List -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-6">News Items</h2>

    {#if loading}
      <LoadingSpinner />
    {:else if $news.length === 0}
      <div class="text-center py-8 text-gray-500">
        No news items available
      </div>
    {:else}
      <div class="space-y-6">
        {#each $news.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) as item}
          <div class="border-b pb-4 last:border-b-0">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-medium text-lg text-gray-900">
                  {item.title}
                  {#if !item.active}
                    <span class="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Inactive
                    </span>
                  {/if}
                </h3>
                <span class="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
              </div>
              <div class="flex gap-2">
                <button
                  on:click={() => startEdit(item)}
                  class="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  on:click={() => handleDelete(item.id)}
                  disabled={loading}
                  class="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
            <div class="prose max-w-none text-gray-600">
              {@html item.content}
            </div>
            {#if item.link}
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-block mt-2 text-green-600 hover:text-green-700"
              >
                Read more →
              </a>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>