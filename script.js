const map = L.map('map').setView([20, -60], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Exemplo de dados simulados
const storms = [
  { name: "Hurricane Lisa", category: 3, lat: 25.3, lon: -70.2, wind: "185 km/h" },
  { name: "Typhoon Kenji", category: 4, lat: 18.7, lon: 135.5, wind: "210 km/h" }
];

// Preencher tabela e mapa
const tbody = document.querySelector("#stormTable tbody");
storms.forEach(storm => {
  const row = tbody.insertRow();
  row.innerHTML = `<td>${storm.name}</td><td>${storm.category}</td><td>${storm.lat}, ${storm.lon}</td><td>${storm.wind}</td>`;
  L.marker([storm.lat, storm.lon]).addTo(map)
    .bindPopup(`<strong>${storm.name}</strong><br>Categoria: ${storm.category}<br>Vento: ${storm.wind}`);
});
