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

function degreesToCardinal(deg) {
  if (typeof deg !== "number" || isNaN(deg)) return "N/A";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const ix = Math.floor((deg + 11.25) / 22.5) % 16;
  return dirs[ix];
}

function computeOffset(lat, lon, bearing, distanceDeg = 1.5) {
  const rad = Math.PI / 180;
  const lat1 = lat * rad;
  const lon1 = lon * rad;
  const brng = bearing * rad;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceDeg * rad) +
    Math.cos(lat1) * Math.sin(distanceDeg * rad) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(distanceDeg * rad) * Math.cos(lat1),
    Math.cos(distanceDeg * rad) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [lat2 / rad, lon2 / rad];
}

loadBtn.onclick = () => {
  const ids = idInput.value.split(",").map(id => id.trim()).filter(Boolean);
  tbody.innerHTML = "";
  fallback.innerHTML = "";
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.GeoJSON || layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });
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
        const name = storm.name || "Sem nome";
        const type = storm.classification || "Sem tipo";
        const lat = parseFloat(storm.latitudeNumeric) || 0;
        const lon = parseFloat(storm.longitudeNumeric) || 0;
        const wind = parseInt(storm.movementSpeed) || 0;
        const bearing = parseFloat(storm.movementDir);
        const direction = degreesToCardinal(bearing);
        const pressure = storm.pressure || "N/A";

        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${name}</td>
          <td>${type}</td>
          <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
          <td>${wind} km/h</td>
          <td>${direction}</td>
          <td>${pressure}</td>
        `;

        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: getColor(wind),
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
        marker.bindPopup(`<strong>${name}</strong><br>
Tipo: ${type}<br>
Vento: ${wind} km/h<br>
Direção: ${direction}<br>
Pressão: ${pressure} hPa`);
        marker.addTo(map);

        if (!isNaN(bearing)) {
          const [destLat, destLon] = computeOffset(lat, lon, bearing, 1.5);
          if (!isNaN(destLat) && !isNaN(destLon)) {
            L.polyline([[lat, lon], [destLat, destLon]], {
              color: "#000",
              weight: 2,
              opacity: 0.9,
              dashArray: "6,4"
            }).addTo(map);
          }
        }
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

      if (advisory) {
        fallback.innerHTML = `<h3>📢 Aviso oficial (XML)</h3><pre>${advisory.textContent.trim()}</pre>`;
      } else {
        fallback.innerHTML = `<p>⚠️ Nenhum aviso encontrado no XML.</p>`;
      }
    })
    .catch(() => {
      fallback.innerHTML = `<p>⚠️ Erro ao carregar boletim XML.</p>`;
    });
}

function loadManualIds(ids) {
  ids.forEach(id => {
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
              <td>—</td>
              <td>${pressure}</td>
            `;

            const marker = L.circleMarker([lat, lon], {
              radius: 8,
              fillColor: getColor(wind),
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            });
            marker.bindPopup(`<strong>${name}</strong><br>
Tipo: ${type}<br>
Vento: ${wind} km/h<br>
Pressão: ${pressure} hPa`);
            marker.addTo(map);
            found = true;
          }
        }).addTo(map);

        if (!found) {
          const row = tbody.insertRow();
          row.innerHTML = `<td>${id}</td><td colspan="6">GeoJSON carregado mas sem dados visíveis</td>`;
        }
      })
      .catch(() => {
        const row = tbody.insertRow();
        row.innerHTML = `<td>${id}</td><td colspan="6">⚠️ Dados não disponíveis ou ficheiro inexistente</td>`;
      });
  });
}

loadBtn.click();