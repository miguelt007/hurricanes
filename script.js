const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

fetch("https://www.nhc.noaa.gov/CurrentStorms.json")
  .then(res => res.json())
  .then(data => {
    const storms = data.activeStorms || [];

    storms.forEach(storm => {
      const {
        name,
        classification,
        intensity,
        pressure,
        latitudeNumeric: lat,
        longitudeNumeric: lon
      } = storm;

      const windSpeed = parseInt(intensity);
      if (isNaN(windSpeed) || windSpeed < 178) return;

      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${name}</td>
        <td>${classification}</td>
        <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
        <td>${windSpeed} km/h</td>
        <td>${pressure || "N/A"}</td>
      `;

      L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>${name}</strong><br>Tipo: ${classification}<br>Vento: ${windSpeed} km/h<br>Pressão: ${pressure || "N/A"} hPa`);
    });
  })
  .catch(err => {
    console.error("Erro ao carregar dados:", err);
    alert("Não foi possível carregar os dados dos furacões.");
  });
