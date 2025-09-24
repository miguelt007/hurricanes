const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

// Fonte oficial NOAA/NWS GeoHub
const geojsonUrl = "https://opendata.arcgis.com/datasets/9e1c3f8c8b5f4b0b9c1f6e6b2f1f3e6e_0.geojson";

fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    const filtered = data.features.filter(feature => {
      const cat = parseInt(feature.properties.SAFFIR_SIM_CAT);
      return !isNaN(cat) && cat >= 3;
    });

    L.geoJSON({ type: "FeatureCollection", features: filtered }, {
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const name = props.STORMNAME || "Desconhecido";
        const type = props.STORMTYPE || "Tropical";
        const lat = props.LAT || 0;
        const lon = props.LON || 0;
        const wind = props.WINDSPEED || "N/A";
        const pressure = props.PRESSURE || "N/A";
        const category = props.SAFFIR_SIM_CAT || "N/A";

        // Adiciona à tabela
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${name}</td>
          <td>${type} (Cat ${category})</td>
          <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
          <td>${wind}</td>
          <td>${pressure}</td>
        `;

        // Adiciona ao mapa
        L.marker([lat, lon]).addTo(map)
          .bindPopup(`<strong>${name}</strong><br>Tipo: ${type}<br>Categoria: ${category}<br>Vento: ${wind} km/h<br>Pressão: ${pressure} hPa`);
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error("Erro ao carregar dados:", err);
    alert("Não foi possível carregar os dados dos furacões.");
  });
