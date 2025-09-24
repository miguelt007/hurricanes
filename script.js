const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");
const idInput = document.getElementById("idInput");
const loadBtn = document.getElementById("loadBtn");
const fallback = document.getElementById("fallback");

function getColor(wind) {
  if (wind >= 250) return "#800026";
  if (wind >= 210) return "#BD0026";
  if (wind >= 178) return "#E31A1C";
  if (wind >= 154) return "#FC4E2A";
  if (wind >= 119) return "#FD8D3C";
  return "#FEB24C";
}

loadBtn.onclick = () => {
  const ids = idInput.value.split(",").map(id => id.trim()).filter(Boolean);
  tbody.innerHTML = "";
  fallback.innerHTML = "";
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.GeoJSON) map.removeLayer(layer);
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  loadFromJson(ids);
};

function loadFromJson(manualIds) {
  const url = "https://api.allorigins.win/raw?url=https://www.nhc.noaa.gov/CurrentStorms.json";

  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.activeStorms || json.activeStorms.length === 0) {
        loadFromXml();
        return;
      }

      json.activeStorms.forEach(storm => {
        const name = storm.stormName || "Sem nome";
        const type = storm.stormType || "Sem tipo";
        const lat = parseFloat(storm.latitude) || 0;
        const lon = parseFloat(storm.longitude) || 0;
        const wind = parseInt(storm.wind) || 0;
        const pressure = storm.pressure || "N/A";

        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${name}</td>
          <td>${type}</td>
          <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
          <td>${wind} km/h</td>
          <td>${pressure}</td>
        `;

        L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: getColor(wind),
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map)
          .bindPopup(`<strong>${name}</strong><br>Tipo: ${type}<br>Vento: ${wind} km/h<br>Pressão: ${pressure} hPa`);
      });

      loadManualIds(manualIds);
    })
    .catch(() => {
      loadFromXml();
      loadManualIds(manualIds);
    });
}

function loadFromXml() {
  const url = "https://api.allorigins.win/raw?url=https://www.nhc.noaa.gov/nhc_at2.xml";

  fetch(url)
    .then(res => res.text())
    .then(xmlText => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const advisory = xmlDoc.querySelector("text");
