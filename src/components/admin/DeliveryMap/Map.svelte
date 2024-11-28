<script>
  import { onMount } from 'svelte';
  let mapContainer;
  let map = null;

  onMount(async () => {
    try {
      // Import Leaflet
      const L = await import('leaflet');
      
      // Initialize map
      map = L.default.map(mapContainer).setView([54.5, -4], 6);

      // Add OpenStreetMap tiles
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add test markers
      L.default.marker([51.5074, -0.1278])
        .addTo(map)
        .bindPopup('London');

      L.default.marker([55.9533, -3.1883])
        .addTo(map)
        .bindPopup('Edinburgh');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  });
</script>

<div class="bg-white p-4 rounded-lg shadow-md">
  <div 
    bind:this={mapContainer}
    class="h-[600px] w-full rounded-lg overflow-hidden bg-gray-100"
  >
    {#if !map}
      <div class="absolute inset-0 flex items-center justify-center">
        <p class="text-gray-600">Loading map...</p>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
    z-index: 1;
  }
</style>