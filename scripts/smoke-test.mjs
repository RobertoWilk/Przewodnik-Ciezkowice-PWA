const baseUrl = process.env.API_URL ?? 'http://localhost:4000/api';

const endpoints = ['/health', '/places', '/routes', '/itineraries', '/settings', '/sources'];

for (const endpoint of endpoints) {
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Endpoint ${endpoint} zwrócił status ${response.status}`);
  }
  const data = await response.json();
  const size = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`OK ${endpoint} (${size})`);
}

console.log('Smoke test API zakończony poprawnie.');
