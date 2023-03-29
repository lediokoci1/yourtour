/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibGVkaW85OSIsImEiOiJjbGYzMGttd3Ewbno1M3NuemptbXI0YjIxIn0.VGL_lodxQO5pZWWqpRgW0Q';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ledio99/clf3314w7007701pe0eq0a2kp',
    scrollZoom: false,
    //   center: [19.817547938723692, 41.327191965532755],
    //   zoom: 6,
    //   // interactive property display map to move by cursour
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
