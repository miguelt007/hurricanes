const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

const url = "https://api.allorigins.win/raw?url=https://www.nhc.noaa.gov/CurrentStorms.json";

fetch(url)
  .then(res => res.json())
  .then(data => {
    const storms = data.activeStorms || [];

    storms.forEach(storm => {
      const {
        id,
        name,
        classification,
        intensity,
        pressure,
        latitudeNumeric: lat,
        longitudeNumeric: lon
      } = storm;

      const windKnots = parseInt(intensity);
      const windKph = Math.round(windKnots * 1.852);
      if (isNaN(windKph)) return;

      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${name}</td>
        <td>${classification}</td>
        <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
        <td>${windKph} km/h</td>
        <td>${pressure || "N/A"}</td>
      `;

      L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>${name}</strong><br>Tipo: ${classification}<br>Vento: ${windKph} km/h<br>Pressão: ${pressure || "N/A"} hPa`);
    });
  })
  .catch(err => {
    console.error("Erro ao carregar dados:", err);
    alert("Não foi possível carregar os dados dos furacões.");
  });
