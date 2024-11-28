import * as turf from '@turf/turf';

export function createRoute(map, points, isSelected = false) {
  if (!map || !points || points.length < 2) {
    console.error('Invalid route parameters:', { map, points });
    return null;
  }

  try {
    const route = turf.lineString(points.map(p => p.geometry.coordinates));
    const sourceId = `route-${Date.now()}`;
    const layerId = `${sourceId}-layer`;

    // Add the route source
    map.addSource(sourceId, {
      type: 'geojson',
      data: route
    });

    // Add the route layer
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#10B981',
        'line-width': 3,
        'line-opacity': isSelected ? 1 : 0.6,
        'line-dasharray': [2, 2]
      }
    });

    // Return an object that can be used to remove the route
    return {
      remove: () => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
    };
  } catch (error) {
    console.error('Error creating route:', error);
    return null;
  }
}