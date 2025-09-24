const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 🗺️ Legenda de intensidade
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  const labels = [
    "Category 5 (≥ 250 km/h)",
    "Category 4 (210–249 km/h)",
    "Category 3 (178–209 km/h)",
    "Category 2 (154–177 km/h)",
    "Category 1 (119–153 km/h)",
    "Tempestade (< 119 km/h)"
  ];
  const colors = ["#800026", "#BD0026", "#E31A1C", "#FC4E2A", "#FD8D3C", "#FEB24C"];

  for (let i = 0; i < labels.length; i++) {
    div.innerHTML +=
      `<i style="background:${colors[i]}; width:12px; height:12px; display:inline-block; margin-right:6px;"></i> ${labels[i]}<br>`;
  }

  return div;
};

legend.addTo(map);

const tbody = document.querySelector("#stormTable tbody");
const fallback = document.getElementById("fallback");

function getColorByIntensity(intensity) {
  switch (intensity) {
    case "Category 5": return "#800026";
    case "Category 4": return "#BD0026";
    case "Category 3": return "#E31A1C";
    case "Category 2": return "#FC4E2A";
    case "Category 1": return "#FD8D3C";
    default: return "#FEB24C";
  }
}

function getColorStyleByIntensity(intensity) {
  const color = getColorByIntensity(intensity);
  return `background:${color}; width:12px; height:12px; display:inline-block; border-radius:50%; margin-right:6px;`;
}

function normalizeIntensity(raw) {
  if (!raw) return "Tempestade";
  const match = raw.match(/Category\s+\d/);
  if (match) return match[0];
  if (raw.includes("Tropical")) return "Tempestade";
  return raw;
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

function loadFromJson() {
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
        const rawIntensity = storm.intensity || "";
        const intensity = normalizeIntensity(rawIntensity);

        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${name}</td>
          <td>${type}</td>
          <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
          <td>${wind} km/h</td>
          <td>${direction}</td>
          <td>${pressure}</td>
          <td><span style="${getColorStyleByIntensity(intensity)}"></span>${intensity}</td>
        `;

        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: getColorByIntensity(intensity),
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
        marker.bindPopup(`<strong>${name}</strong><br>
Tipo: ${type}<br>
Intensidade: ${intensity}<br>
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
    })
    .catch(() => {
      loadFromXml();
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

loadFromJson();