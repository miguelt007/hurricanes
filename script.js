const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");
const legend = L.control({ position: 'bottomright' });
const refreshBtn = document.createElement("button");

// ⚠️ Lista manual de IDs ativos
// Podes obter os IDs reais aqui: https://www.nhc.noaa.gov/cyclones/
const stormIds = [
  "AL072025", // Gabrielle
  "EP132025", // Mario
  "EP142025"  // Narda (exemplo)
];

// Cores por intensidade (km/h)
function getColor(wind) {
  if (wind >= 250) return "#800026"; // Cat 5
  if (wind >= 210) return "#BD0026"; // Cat 4
  if (wind >= 178) return "#E31A1C"; // Cat 3
  if (wind >= 154) return "#FC4E2A"; // Cat 2
  if (wind >= 119) return "#FD8D3C"; // Cat 1
  return "#FEB24C"; // TS ou menos
}

// Legenda dinâmica
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [119, 154, 178, 210, 250];
  const labels = ["Cat 1", "Cat 2", "Cat 3", "Cat 4", "Cat 5"];

  div.innerHTML = "<strong>Intensidade</strong><br>";
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML +=
      `<i style="background:${getColor(grades[i] + 1)}; width:18px; height:18px; display:inline-block;"></i> ${labels[i]}<br>`;
  }
  return div;
};
legend.addTo(map);

// Botão de atualização
refreshBtn.textContent = "🔄 Atualizar dados";
refreshBtn.style = "margin-top:10px; padding:6px 12px; font-size:16px;";
document.body.insertBefore(refreshBtn, document.getElementById("map"));

refreshBtn.onclick = () => {
  tbody.innerHTML = "";
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.GeoJSON) map.removeLayer(layer);
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  loadStorms();
};

function loadStorms() {
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
            const wind = parseInt(props.WINDSPEED) || 0;
            const pressure = props.PRESSURE || "N/A";

            const row = tbody.insertRow();
            row.innerHTML = `
              <td>${name}</td>
              <td>${type}</td>
              <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
              <td>${wind} km/h</td>
              <td>${pressure}</td>
            `;

            const marker = L.circleMarker([lat, lon], {
              radius: 8,
              fillColor: getColor(wind),
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`<strong>${name}</strong><br>Tipo: ${type}<br>Vento: ${wind} km/h<br>Pressão: ${pressure} hPa`);
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
}

loadStorms();
