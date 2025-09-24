const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

// ⚠️ Lista manual de IDs ativos
// Podes obter os IDs reais aqui: https://www.nhc.noaa.gov/cyclones/
const stormIds = [
  "AL072025", // Gabrielle
  "EP132025", // Mario
  "EP142025"  // Narda (exemplo)
];

stormIds.forEach(id => {
  const geojsonUrl = `https://www.nhc.noaa.gov/gis/forecast/archive/${id}_5day_latest.geojson`;

  fetch(geojsonUrl)
    .then(res => {
      if (!res.ok) throw new Error("GeoJSON não encontrado");
      return res.json();
    })
    .then(data => {
      let found = false;

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

          found = true;
        }
      }).addTo(map);

      if (!found) {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${id}</td>
          <td colspan="4">GeoJSON carregado mas sem dados visíveis</td>
        `;
      }
    })
    .catch(() => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${id}</td>
        <td colspan="4">⚠️ Dados não disponíveis ou ficheiro inexistente</td>
      `;
    });
});
