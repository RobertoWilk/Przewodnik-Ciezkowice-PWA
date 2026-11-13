const baseUrl = process.env.API_URL ?? 'http://localhost:4000/api';

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`OK ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, error });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {})
    }
  });
}

function expectStatus(response, expected, name) {
  const statuses = Array.isArray(expected) ? expected : [expected];
  if (!statuses.includes(response.status)) {
    throw new Error(`${name}: oczekiwano ${statuses.join('/')} otrzymano ${response.status}`);
  }
}

await check('nagłówki bezpieczeństwa na /health', async () => {
  const response = await request('/health');
  expectStatus(response, 200, 'health');
  const requiredHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer'
  };
  for (const [header, value] of Object.entries(requiredHeaders)) {
    if (response.headers.get(header) !== value) {
      throw new Error(`brak lub błędna wartość nagłówka ${header}`);
    }
  }
});

await check('panel admina blokuje brak tokenu', async () => {
  const response = await request('/admin/dashboard');
  expectStatus(response, 401, 'admin without token');
});

await check('panel admina blokuje niepoprawny token', async () => {
  const response = await request('/admin/dashboard', { headers: { Authorization: 'Bearer invalid-token' } });
  expectStatus(response, 401, 'admin invalid token');
});

await check('błędne logowanie zwraca 401', async () => {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@ciezkowice.local', password: 'zle-haslo' })
  });
  expectStatus(response, 401, 'bad login');
});

await check('słabe hasło przy rejestracji jest odrzucane', async () => {
  const response = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: `test-${Date.now()}@local.test`, password: '123' })
  });
  expectStatus(response, 400, 'weak password');
});

await check('zapytanie SQL injection nie powoduje błędu serwera', async () => {
  const response = await request(`/places?q=${encodeURIComponent("%' OR 1=1 --")}`);
  expectStatus(response, 200, 'sql-like query');
  await response.json();
});

await check('zapytanie XSS nie powoduje błędu serwera', async () => {
  const response = await request(`/places?q=${encodeURIComponent('<script>alert(1)</script>')}`);
  expectStatus(response, 200, 'xss-like query');
  await response.json();
});

await check('dodawanie miejsca bez tokenu jest zablokowane', async () => {
  const response = await request('/admin/places', {
    method: 'POST',
    body: JSON.stringify({ slug: 'security-test', name: 'Security Test' })
  });
  expectStatus(response, 401, 'admin create without token');
});

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  throw new Error(`Testy bezpieczeństwa nie powiodły się: ${failed.length}`);
}

console.log('Testy bezpieczeństwa zakończone poprawnie.');
