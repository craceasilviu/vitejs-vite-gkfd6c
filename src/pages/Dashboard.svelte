<script>
  import MultiProduceForm from '../components/MultiProduceForm.svelte';
  import NewsFeed from '../components/NewsFeed.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="grid md:grid-cols-2 gap-8">
    <div>
      <h2 class="text-xl font-semibold mb-4">Submit New Offer</h2>
      <MultiProduceForm />
    </div>
    <div>
      <NewsFeed />
    </div>
  </div>
</div>