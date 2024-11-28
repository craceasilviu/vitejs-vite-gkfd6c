import mapboxgl from 'mapbox-gl';

export function createMarker(map, latlng, type, details) {
  if (!map || !latlng || !Array.isArray(latlng) || latlng.length !== 2) {
    console.error('Invalid marker parameters:', { map, latlng, type, details });
    return null;
  }

  try {
    // Create custom marker element
    const el = document.createElement('div');
    el.className = `${type}-marker`;
    
    const markerContent = document.createElement('div');
    markerContent.className = `w-8 h-8 bg-${type === 'producer' ? 'green' : 'blue'}-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg`;
    markerContent.textContent = type === 'producer' ? 'P' : 'W';
    el.appendChild(markerContent);

    // Create popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="text-sm">
          <p class="font-bold">${details.name || 'Unknown'}</p>
          <p>${details.location || ''}</p>
          ${details.deliveries ? `<p class="mt-1">${details.deliveries}</p>` : ''}
        </div>
      `);

    // Create and add marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([latlng[1], latlng[0]])
      .setPopup(popup)
      .addTo(map);

    return marker;
  } catch (error) {
    console.error('Error creating marker:', error);
    return null;
  }
}