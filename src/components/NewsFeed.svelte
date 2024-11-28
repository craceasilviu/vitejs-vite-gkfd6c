<script>
  import { news, loading as newsLoading } from '../stores/news';
  import { format } from 'date-fns';
  import LoadingSpinner from '../lib/LoadingSpinner.svelte';

  function formatDate(date) {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  }

  $: activeNews = $news.filter(n => n.active);
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-semibold mb-4">Latest News</h2>

  {#if $newsLoading}
    <LoadingSpinner />
  {:else if !activeNews || activeNews.length === 0}
    <div class="text-center py-8 text-gray-500">
      No news available at the moment
    </div>
  {:else}
    <div class="space-y-6">
      {#each activeNews as item (item.id)}
        <div class="border-b pb-4 last:border-b-0">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-medium text-lg text-gray-900">{item.title}</h3>
            <span class="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
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