const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#stormTable tbody");

fetch("https://www.cyclocane.com/api/current-storms.json")
  .then(res => res.json())
  .then(data => {
    data.forEach(storm => {
      const { name, category, lat, lon, wind_kph, pressure } = storm;

      // Adiciona à tabela
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${name}</td>
        <td>${category || "N/A"}</td>
        <td>${lat}, ${lon}</td>
        <td>${wind_kph || "N/A"}</td>
        <td>${pressure || "N/A"}</td>
      `;

      // Adiciona ao mapa
      L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>${name}</strong><br>Categoria: ${category || "N/A"}<br>Vento: ${wind_kph || "N/A"} km/h<br>Pressão: ${pressure || "N/A"} hPa`);
    });
  })
  .catch(err => {
    console.error("Erro ao obter dados:", err);
    alert("Não foi possível carregar os dados dos furacões.");
  });
