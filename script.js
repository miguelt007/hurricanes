const apiKey = "c43af272657b41b8ad291347252409"; // substitui pela tua chave gratuita
const cities = ["Lisboa", "Miami", "Tokyo", "Sydney"];
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.querySelector("#weatherTable tbody");

cities.forEach(city => {
  fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`)
    .then(res => res.json())
    .then(data => {
      const { name, lat, lon } = data.location;
      const { temp_c, wind_kph, condition } = data.current;

      // Adiciona à tabela
      const row = tbody.insertRow();
      row.innerHTML = `<td>${name}</td><td>${temp_c}°C</td><td>${wind_kph} km/h</td><td>${condition.text}</td>`;

      // Adiciona ao mapa
      L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>${name}</strong><br>${condition.text}<br>Temp: ${temp_c}°C<br>Vento: ${wind_kph} km/h`);
    });
});
