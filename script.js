const map = L.map('map').setView([25, -70], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Exemplo de furacão ativo (substitui por outro se necessário)
const geojsonUrl = "https://www.nhc.noaa.gov/gis/forecast/archive/AL052025_5day_latest.geojson";

fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const popup = `
          <strong>${props.STORMNAME || "Furacão"}</strong><br>
          Tipo: ${props.STORMTYPE || "Desconhecido"}<br>
          Data: ${props.ADVDATE || "N/A"}
        `;
        layer.bindPopup(popup);
      },
      style: {
        color: "red",
        weight: 2,
        opacity: 0.8
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error("Erro ao carregar GeoJSON:", err);
    alert("Não foi possível carregar os dados do furacão.");
  });
