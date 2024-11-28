<script>
  import { onMount, onDestroy } from 'svelte';
  import { users } from '../../stores/users';
  import { offers, OFFER_STATUS } from '../../stores/offers';
  import { format, isSameDay } from 'date-fns';
  import { DAYS_OF_WEEK } from '../../lib/dateUtils';
  import L from 'leaflet';
  import 'leaflet-routing-machine';
  import * as turf from '@turf/turf';
  
  let mapContainer;
  let map = null;
  let markers = [];
  let routes = [];
  let selectedDate = new Date();
  let selectedProducer = null;
  let loading = false;

  function handleDateChange(event) {
    selectedDate = new Date(event.target.value);
    updateMapMarkers();
  }

  function handleProducerChange(event) {
    selectedProducer = event.target.value;
    updateMapMarkers();
  }

  async function initializeMap() {
    if (!mapContainer || map) return;
    
    try {
      // Create map instance
      map = L.map(mapContainer, {
        center: [46.0, 25.0], // Center on Romania
        zoom: 7,
        zoomControl: true
      });
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Add initial markers
      updateMapMarkers();
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  function clearMap() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Clear existing routes
    routes.forEach(route => route.remove());
    routes = [];
  }

  function getWarehouseById(warehouseRef) {
    if (!warehouseRef) return null;
    const [supermarketId, warehouseId] = warehouseRef.split(':');
    const supermarket = $users.find(u => u.id === supermarketId);
    return supermarket?.warehouses?.find(w => w.id === warehouseId);
  }

  function createRoute(from, to, color = '#10B981', weight = 3) {
    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;

    try {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(from.lat, from.lng),
          L.latLng(to.lat, to.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color, opacity: 0.8, weight }]
        },
        createMarker: () => null // Don't create default markers
      });

      return routingControl;
    } catch (error) {
      console.error('Error creating route:', error);
      return null;
    }
  }

  function addDeliveryRoutes(producer, deliveries) {
    if (!producer.address?.lat || !producer.address?.lng) return;

    // Create route for each delivery
    deliveries.forEach(delivery => {
      const warehouse = getWarehouseById(delivery.warehouseId);
      if (!warehouse?.lat || !warehouse?.lng) return;

      const route = createRoute(
        producer.address,
        warehouse,
        '#10B981',
        delivery.quantity > 100 ? 5 : 3
      );

      if (route) {
        route.on('routesfound', function(e) {
          const routeData = e.routes[0];
          if (routeData && routeData.routeLine) {
            routeData.routeLine.bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${producer.companyName} → ${warehouse.name}</h3>
                <p class="text-sm">Distance: ${(routeData.summary.totalDistance / 1000).toFixed(1)} km</p>
                <p class="text-sm">Time: ${Math.round(routeData.summary.totalTime / 60)} minutes</p>
                <p class="text-sm">Quantity: ${delivery.quantity} units</p>
              </div>
            `);
          }
        });

        route.addTo(map);
        routes.push(route);
      }
    });
  }

  function getDeliveriesForDate() {
    return $offers
      .filter(offer => {
        // Check if offer has deliveries for the selected date
        return offer.status === OFFER_STATUS.APPROVED &&
          offer.weekDates.some((date, index) => {
            if (isSameDay(new Date(date), selectedDate)) {
              const day = DAYS_OF_WEEK[index];
              return offer.deliveryAllocations[day]?.some(p => 
                p.allocations?.some(a => a.quantity > 0)
              );
            }
            return false;
          }) &&
          (!selectedProducer || offer.producerId === selectedProducer);
      })
      .map(offer => {
        const producer = $users.find(u => u.id === offer.producerId);
        if (!producer) return null;

        // Find the day that matches the selected date
        const dayIndex = offer.weekDates.findIndex(date => 
          isSameDay(new Date(date), selectedDate)
        );
        const day = DAYS_OF_WEEK[dayIndex];

        const deliveries = offer.deliveryAllocations[day]
          .flatMap(product => 
            product.allocations
              .filter(a => a.quantity > 0)
              .map(allocation => ({
                warehouseId: allocation.warehouseId,
                quantity: allocation.quantity,
                productName: product.productId
              }))
          );

        return { producer, deliveries };
      })
      .filter(Boolean);
  }

  function createMarkerPopup(title, details) {
    const container = document.createElement('div');
    container.className = 'p-3';
    
    const content = `
      <h3 class="font-bold text-gray-900">${title}</h3>
      ${details}
    `;
    
    container.innerHTML = content;
    return container;
  }

  function formatWorkingHours(hours) {
    if (!hours) return 'Not specified';
    return `${hours.start} - ${hours.end}`;
  }

  function updateMapMarkers() {
    if (!map) return;
    clearMap();

    // Get deliveries for selected date
    const deliveriesForDate = getDeliveriesForDate();
    const activeDeliveries = new Set();

    // Collect active delivery routes
    deliveriesForDate.forEach(({ producer, deliveries }) => {
      deliveries.forEach(delivery => {
        const [supermarketId, warehouseId] = delivery.warehouseId.split(':');
        activeDeliveries.add(`${supermarketId}:${warehouseId}`);
      });
    });

    // Add all warehouse markers
    $users.forEach(user => {
      if (user.role === 'supermarket' && user.warehouses) {
        user.warehouses.forEach(warehouse => {
          if (warehouse.lat && warehouse.lng) {
            const isActive = activeDeliveries.has(`${user.id}:${warehouse.id}`);
            const marker = L.marker([warehouse.lat, warehouse.lng], {
              icon: L.divIcon({
                className: `warehouse-marker ${isActive ? 'active' : ''}`,
                html: `
                  <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:w-10 hover:h-10 hover:bg-blue-600">
                    W
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })
            });
            
            const popupContent = createMarkerPopup(
              warehouse.name,
              `
                <div class="mt-2 space-y-1 text-sm">
                  <p class="text-gray-600">${warehouse.street}</p>
                  <p class="text-gray-600">${warehouse.city}, ${warehouse.state}</p>
                  <p class="text-gray-600">${warehouse.country}</p>
                  <p class="mt-2">
                    <span class="font-medium">Working Hours:</span>
                    <span class="text-gray-600">${formatWorkingHours(warehouse.workingHours)}</span>
                  </p>
                  ${warehouse.gln ? `
                    <p>
                      <span class="font-medium">GLN:</span>
                      <span class="text-gray-600">${warehouse.gln}</span>
                    </p>
                  ` : ''}
                </div>
              `
            );

            marker.bindPopup(popupContent);
            
            // Add hover effect
            marker.on('mouseover', function(e) {
              this.openPopup();
              const icon = this.getElement();
              if (icon) {
                icon.querySelector('div').classList.add('hover:scale-110');
              }
            });
            
            marker.on('mouseout', function(e) {
              this.closePopup();
              const icon = this.getElement();
              if (icon) {
                icon.querySelector('div').classList.remove('hover:scale-110');
              }
            });
            
            marker.addTo(map);
            markers.push(marker);
          }
        });
      }
    });

    // Add all producer markers
    $users.forEach(user => {
      if (user.role === 'producer' && user.address?.lat && user.address?.lng) {
        const isActive = deliveriesForDate.some(d => d.producer.id === user.id);
        const marker = L.marker([user.address.lat, user.address.lng], {
          icon: L.divIcon({
            className: `producer-marker ${isActive ? 'active' : ''}`,
            html: `
              <div class="w-8 h-8 ${isActive ? 'bg-green-500' : 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:w-10 hover:h-10 hover:bg-green-600">
                P
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        });
        
        const popupContent = createMarkerPopup(
          user.companyName,
          `
            <div class="mt-2 space-y-1 text-sm">
              <p class="text-gray-600">${user.address.street}</p>
              <p class="text-gray-600">${user.address.city}, ${user.address.state}</p>
              <p class="text-gray-600">${user.address.country}</p>
              ${user.vatNumber ? `
                <p class="mt-2">
                  <span class="font-medium">VAT:</span>
                  <span class="text-gray-600">${user.vatNumber}</span>
                </p>
              ` : ''}
            </div>
          `
        );

        marker.bindPopup(popupContent);
        
        // Add hover effect
        marker.on('mouseover', function(e) {
          this.openPopup();
          const icon = this.getElement();
          if (icon) {
            icon.querySelector('div').classList.add('hover:scale-110');
          }
        });
        
        marker.on('mouseout', function(e) {
          this.closePopup();
          const icon = this.getElement();
          if (icon) {
            icon.querySelector('div').classList.remove('hover:scale-110');
          }
        });
        
        marker.addTo(map);
        markers.push(marker);
      }
    });

    // Add delivery routes
    deliveriesForDate.forEach(({ producer, deliveries }) => {
      addDeliveryRoutes(producer, deliveries);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  onMount(() => {
    initializeMap();
  });

  onDestroy(() => {
    clearMap();
    if (map) {
      map.remove();
      map = null;
    }
  });

  $: producers = $users.filter(user => 
    user.role === 'producer' &&
    $offers.some(o => 
      o.producerId === user.id && 
      o.status === OFFER_STATUS.APPROVED
    )
  );
</script>

<div class="bg-white rounded-lg shadow-md p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h2 class="text-2xl font-semibold text-gray-800">Distribution Network</h2>
      <p class="text-sm text-gray-600 mt-1">
        Select a date and producer to view deliveries
      </p>
    </div>
    <div class="flex gap-4">
      <select
        value={selectedProducer}
        on:change={handleProducerChange}
        class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">All Producers</option>
        {#each producers as producer}
          <option value={producer.id}>{producer.companyName}</option>
        {/each}
      </select>
      <input 
        type="date" 
        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
        on:change={handleDateChange}
        class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  </div>

  <!-- Map Container -->
  <div class="h-[700px] rounded-lg overflow-hidden border border-gray-200 shadow-inner bg-gray-50">
    <div 
      bind:this={mapContainer}
      class="w-full h-full"
    >
      {#if !map}
        <div class="h-full flex items-center justify-center">
          <p class="text-gray-500">Loading map...</p>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="mt-4 flex justify-between items-start">
    <div class="text-sm text-gray-600">
      <p>Hover over markers to see details. Click on routes for delivery information.</p>
    </div>
    <div class="flex items-center gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full bg-green-500"></div>
        <span>Active Producer</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full bg-gray-400"></div>
        <span>Inactive Producer</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full bg-blue-500"></div>
        <span>Warehouse Location</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-8 h-1 bg-green-500"></div>
        <span>Delivery Route</span>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.leaflet-container) {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  :global(.leaflet-popup-content-wrapper) {
    border-radius: 0.5rem;
  }
  
  :global(.leaflet-popup-content) {
    margin: 0;
  }
  
  :global(.producer-marker),
  :global(.warehouse-marker) {
    background: transparent;
    border: none;
  }

  /* Hide unnecessary routing machine controls */
  :global(.leaflet-routing-container) {
    display: none;
  }

  :global(.producer-marker.active),
  :global(.warehouse-marker.active) {
    z-index: 1000;
  }
</style>