const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

// ⚠️ Lista manual de IDs ativos
// Podes obter os IDs reais aqui: https://www.nhc.noaa.gov/cyclones/
const stormIds = [
  "AL072025", // Gabrielle
  "EP132025"  // Mario
];

stormIds.forEach(id => {
  const geojsonUrl = `https://www.nhc.noaa.gov/gis/forecast/archive/${id}_5day_latest.geojson`;

  // Verifica se o ficheiro existe antes de tentar carregar
  fetch(geojsonUrl, { method: "HEAD" })
    .then(response => {
      if (!response.ok) {
        console.warn(`GeoJSON não encontrado para ${id}`);
        return;
      }

      // Se existir, carrega os dados
      fetch(geojsonUrl)
        .then(res => res.json())
        .then(data => {
          L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
              const props = feature.properties;
              const name = props.STORMNAME || id;
              const type = props.STORMTYPE || "Tropical";
              const lat = props.LAT || 0;
              const lon = props.LON || 0;
              const wind = props.WINDSPEED || "N/A";
              const pressure = props.PRESSURE || "N/A";

              const row = tbody.insertRow();
              row.innerHTML = `
                <td>${name}</td>
                <td>${type}</td>
                <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
                <td>${wind}</td>
                <td>${pressure}</td>
              `;

              L.marker([lat, lon]).addTo(map)
                .bindPopup(`<strong>${name}</strong><br>Tipo: ${type}<br>Vento: ${wind} km/h<br>Pressão: ${pressure} hPa`);
            }
          }).addTo(map);
        })
        .catch(err => {
          console.error(`Erro ao carregar dados de ${id}:`, err);
        });
    })
    .catch(err => {
      console.error(`Erro ao verificar existência de ${id}:`, err);
    });
});
