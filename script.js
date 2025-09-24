const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

// Proxy para contornar CORS
const proxy = "https://api.allorigins.win/raw?url=";
const sourceUrl = "https://www.nhc.noaa.gov/cyclones/";

fetch(proxy + encodeURIComponent(sourceUrl))
  .then(res => res.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = [...doc.querySelectorAll("a")];

    const stormLinks = links.filter(link =>
      link.href.includes("gis/forecast/archive/") &&
      link.href.endsWith("_5day_latest.shtml")
    );

    const stormIds = stormLinks.map(link => {
      const match = link.href.match(/\/([A-Z]{2}\d{2}\d{4})_5day_latest\.shtml$/);
      return match ? match[1] : null;
    }).filter(Boolean);

    stormIds.forEach(id => {
      const geojsonUrl = `https://www.nhc.noaa.gov/gis/forecast/archive/${id}_5day_latest.geojson`;

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
          console.warn(`Erro ao carregar ${id}:`, err);
        });
    });
  })
  .catch(err => {
    console.error("Erro ao extrair sistemas ativos:", err);
    alert("Não foi possível carregar os dados dos furacões.");
  });
