import mapboxgl from 'mapbox-gl';

// Replace with your Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNrZzZ2bzN6dzAyMnoyeXFsdW5uYmJjNGsifQ.hZvYLV4_pM_zKOXm7vBDzw';

mapboxgl.accessToken = MAPBOX_TOKEN;

export async function initializeMap(container, center = [-0.127758, 51.507351], zoom = 5) {
  if (!container) {
    throw new Error('Map container element is required');
  }

  try {
    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
      attributionControl: true
    });

    // Wait for map to load
    await new Promise(resolve => map.on('load', resolve));

    return map;
  } catch (error) {
    console.error('Map initialization failed:', error);
    throw error;
  }
}