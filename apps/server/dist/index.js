import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optionalAuth, requireAdmin, requireAuth, requireManager, signToken } from './auth.js';
import { getAll, getAppSettings, getOne, insertItinerary, insertPlace, insertRoute, normalizeItinerary, normalizePlace, normalizeRoute, run, seedIfEmpty, updateItinerary, updateAppSettings, updatePlace, updateRoute } from './db.js';
seedIfEmpty();
const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(optionalAuth);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Przewodnik Ciężkowice', time: new Date().toISOString() });
});
app.get('/api/categories', (_req, res) => {
    const rows = getAll('SELECT category, COUNT(*) AS count FROM places GROUP BY category ORDER BY category');
    res.json(rows.map((row) => ({ ...row, label: categoryLabel(row.category) })));
});
app.get('/api/places', (req, res) => {
    const q = String(req.query.q ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const where = [];
    const params = [];
    if (q) {
        where.push('(LOWER(name) LIKE ? OR LOWER(short_description) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)');
        const value = `%${q.toLowerCase()}%`;
        params.push(value, value, value, value);
    }
    if (category && category !== 'all') {
        where.push('category = ?');
        params.push(category);
    }
    const sql = `SELECT * FROM places ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY is_featured DESC, name ASC`;
    const rows = getAll(sql, params).map(normalizePlace);
    res.json(rows);
});
app.get('/api/places/:slug', (req, res) => {
    const row = getOne('SELECT * FROM places WHERE slug = ?', [req.params.slug]);
    if (!row)
        return res.status(404).json({ message: 'Nie znaleziono miejsca.' });
    res.json(normalizePlace(row));
});
app.get('/api/routes', (_req, res) => {
    const rows = getAll('SELECT * FROM routes ORDER BY title ASC').map(normalizeRoute);
    res.json(rows);
});
app.get('/api/itineraries', (_req, res) => {
    const rows = getAll('SELECT * FROM itineraries ORDER BY type ASC').map(normalizeItinerary);
    res.json(rows);
});
app.get('/api/stats', (_req, res) => {
    const totalPlaces = getOne('SELECT COUNT(*) AS count FROM places')?.count ?? 0;
    const totalRoutes = getOne('SELECT COUNT(*) AS count FROM routes')?.count ?? 0;
    const totalUsers = getOne('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['user'])?.count ?? 0;
    const byCategory = getAll('SELECT category, COUNT(*) AS count FROM places GROUP BY category ORDER BY count DESC').map((row) => ({ ...row, label: categoryLabel(row.category) }));
    res.json({
        totalPlaces,
        totalRoutes,
        totalUsers,
        byCategory,
        projectTitle: 'Przewodnik w formie aplikacji mobilnej Ciężkowice'
    });
});
app.get('/api/sources', (_req, res) => {
    const placeSources = getAll('SELECT DISTINCT source_label AS sourceLabel, source_url AS sourceUrl FROM places ORDER BY source_label');
    const routeSources = getAll('SELECT DISTINCT source_label AS sourceLabel, source_url AS sourceUrl FROM routes ORDER BY source_label');
    const sources = [...placeSources, ...routeSources].filter((source, index, list) => list.findIndex((item) => item.sourceUrl === source.sourceUrl) === index);
    res.json(sources);
});
app.get('/api/settings', (_req, res) => {
    res.json(getAppSettings());
});
app.post('/api/search-history', (req, res) => {
    if (!req.user)
        return res.status(204).send();
    const query = String(req.body?.query ?? '').trim();
    if (!query)
        return res.status(400).json({ message: 'Brak zapytania.' });
    run('INSERT INTO search_history (user_id, query) VALUES (?, ?)', [req.user.sub, query]);
    res.status(201).json({ message: 'Zapisano wyszukiwanie.' });
});
app.post('/api/auth/register', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!email.includes('@') || password.length < 6) {
        return res.status(400).json({ message: 'Podaj e-mail i hasło mające minimum 6 znaków.' });
    }
    const exists = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (exists)
        return res.status(409).json({ message: 'Konto o takim adresie już istnieje.' });
    run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [email, bcrypt.hashSync(password, 10), 'user']);
    const user = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user)
        return res.status(500).json({ message: 'Nie udało się utworzyć konta.' });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
});
app.post('/api/auth/login', (req, res) => {
    if (isLoginBlocked(req)) {
        return res.status(429).json({ message: 'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za kilka minut.' });
    }
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const user = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        registerLoginFailure(req);
        return res.status(401).json({ message: 'Nieprawidłowy e-mail lub hasło.' });
    }
    clearLoginFailures(req);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token, user: publicUser(user) });
});
app.get('/api/me', requireAuth, (req, res) => {
    const user = getOne('SELECT * FROM users WHERE id = ?', [req.user?.sub]);
    if (!user)
        return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    res.json(publicUser(user));
});
app.get('/api/me/favorites', requireAuth, (req, res) => {
    const rows = getAll(`SELECT p.* FROM places p
     INNER JOIN favorites f ON f.place_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`, [req.user?.sub]).map(normalizePlace);
    res.json(rows);
});
app.post('/api/me/favorites/:placeId', requireAuth, (req, res) => {
    const placeId = Number(req.params.placeId);
    const place = getOne('SELECT * FROM places WHERE id = ?', [placeId]);
    if (!place)
        return res.status(404).json({ message: 'Nie znaleziono miejsca.' });
    run('INSERT OR IGNORE INTO favorites (user_id, place_id) VALUES (?, ?)', [req.user?.sub, placeId]);
    res.status(201).json({ message: 'Dodano do ulubionych.' });
});
app.delete('/api/me/favorites/:placeId', requireAuth, (req, res) => {
    run('DELETE FROM favorites WHERE user_id = ? AND place_id = ?', [req.user?.sub, Number(req.params.placeId)]);
    res.status(204).send();
});
app.get('/api/me/search-history', requireAuth, (req, res) => {
    const rows = getAll('SELECT id, query, created_at FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user?.sub]);
    res.json(rows.map((row) => ({ id: row.id, query: row.query, createdAt: row.created_at })));
});
app.put('/api/me/password', requireAuth, (req, res) => {
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    if (newPassword.length < 6)
        return res.status(400).json({ message: 'Nowe hasło musi mieć minimum 6 znaków.' });
    const user = getOne('SELECT * FROM users WHERE id = ?', [req.user?.sub]);
    if (!user)
        return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(401).json({ message: 'Aktualne hasło jest nieprawidłowe.' });
    }
    run('UPDATE users SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(newPassword, 10), user.id]);
    res.json({ message: 'Hasło zostało zmienione.' });
});
app.get('/api/admin/dashboard', requireManager, (_req, res) => {
    const places = getOne('SELECT COUNT(*) AS count FROM places')?.count ?? 0;
    const routes = getOne('SELECT COUNT(*) AS count FROM routes')?.count ?? 0;
    const itineraries = getOne('SELECT COUNT(*) AS count FROM itineraries')?.count ?? 0;
    const users = getOne('SELECT COUNT(*) AS count FROM users')?.count ?? 0;
    const searches = getOne('SELECT COUNT(*) AS count FROM search_history')?.count ?? 0;
    const favorites = getOne('SELECT COUNT(*) AS count FROM favorites')?.count ?? 0;
    res.json({ places, routes, itineraries, users, searches, favorites });
});
app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const users = getAll('SELECT * FROM users ORDER BY role ASC, email ASC')
        .map(publicUser);
    res.json(users);
});
app.post('/api/admin/users', requireAdmin, (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const role = parseRole(req.body?.role);
    if (!email.includes('@') || password.length < 6) {
        return res.status(400).json({ message: 'Podaj poprawny e-mail i hasło mające minimum 6 znaków.' });
    }
    const exists = getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (exists)
        return res.status(409).json({ message: 'Konto o takim adresie już istnieje.' });
    run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [email, bcrypt.hashSync(password, 10), role]);
    const created = getOne('SELECT * FROM users WHERE email = ?', [email]);
    res.status(201).json(created ? publicUser(created) : null);
});
app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const role = parseRole(req.body?.role);
    const user = getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user)
        return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    if (id === req.user?.sub && role !== 'admin') {
        return res.status(400).json({ message: 'Nie można odebrać roli admin aktualnie zalogowanemu kontu.' });
    }
    run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updated = getOne('SELECT * FROM users WHERE id = ?', [id]);
    res.json(updated ? publicUser(updated) : null);
});
app.put('/api/admin/users/:id/password', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const password = String(req.body?.password ?? '');
    if (password.length < 6)
        return res.status(400).json({ message: 'Hasło musi mieć minimum 6 znaków.' });
    const user = getOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user)
        return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
    run('UPDATE users SET password_hash = ? WHERE id = ?', [bcrypt.hashSync(password, 10), id]);
    res.json({ message: 'Hasło użytkownika zostało zresetowane.' });
});
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user?.sub)
        return res.status(400).json({ message: 'Nie można usunąć aktualnie zalogowanego konta.' });
    run('DELETE FROM users WHERE id = ?', [id]);
    res.status(204).send();
});
app.put('/api/admin/settings', requireAdmin, (req, res) => {
    updateAppSettings({
        appTitle: cleanString(req.body?.appTitle) || undefined,
        appSubtitle: cleanString(req.body?.appSubtitle) || undefined,
        contactEmail: cleanString(req.body?.contactEmail) || undefined,
        contactPhone: cleanString(req.body?.contactPhone) || undefined,
        englishEnabled: Boolean(req.body?.englishEnabled)
    });
    res.json(getAppSettings());
});
app.post('/api/admin/places', requireManager, (req, res) => {
    const place = parsePlaceInput(req.body);
    if (!place)
        return res.status(400).json({ message: 'Nieprawidłowe dane miejsca.' });
    try {
        insertPlace(place);
        const created = getOne('SELECT * FROM places WHERE slug = ?', [place.slug]);
        res.status(201).json(created ? normalizePlace(created) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się dodać miejsca. Sprawdź unikalny slug.', error: String(error) });
    }
});
app.put('/api/admin/places/:id', requireManager, (req, res) => {
    const id = Number(req.params.id);
    const existing = getOne('SELECT * FROM places WHERE id = ?', [id]);
    if (!existing)
        return res.status(404).json({ message: 'Nie znaleziono miejsca.' });
    const place = parsePlaceInput(req.body);
    if (!place)
        return res.status(400).json({ message: 'Nieprawidłowe dane miejsca.' });
    try {
        updatePlace(id, place);
        const updated = getOne('SELECT * FROM places WHERE id = ?', [id]);
        res.json(updated ? normalizePlace(updated) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się zaktualizować miejsca.', error: String(error) });
    }
});
app.delete('/api/admin/places/:id', requireManager, (req, res) => {
    const id = Number(req.params.id);
    run('DELETE FROM places WHERE id = ?', [id]);
    res.status(204).send();
});
app.post('/api/admin/routes', requireManager, (req, res) => {
    const route = parseRouteInput(req.body);
    if (!route)
        return res.status(400).json({ message: 'Nieprawidłowe dane trasy.' });
    try {
        insertRoute(route);
        const created = getOne('SELECT * FROM routes WHERE slug = ?', [route.slug]);
        res.status(201).json(created ? normalizeRoute(created) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się dodać trasy. Sprawdź unikalny slug.', error: String(error) });
    }
});
app.put('/api/admin/routes/:id', requireManager, (req, res) => {
    const id = Number(req.params.id);
    const existing = getOne('SELECT * FROM routes WHERE id = ?', [id]);
    if (!existing)
        return res.status(404).json({ message: 'Nie znaleziono trasy.' });
    const route = parseRouteInput(req.body);
    if (!route)
        return res.status(400).json({ message: 'Nieprawidłowe dane trasy.' });
    try {
        updateRoute(id, route);
        const updated = getOne('SELECT * FROM routes WHERE id = ?', [id]);
        res.json(updated ? normalizeRoute(updated) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się zaktualizować trasy.', error: String(error) });
    }
});
app.delete('/api/admin/routes/:id', requireManager, (req, res) => {
    run('DELETE FROM routes WHERE id = ?', [Number(req.params.id)]);
    res.status(204).send();
});
app.post('/api/admin/itineraries', requireManager, (req, res) => {
    const itinerary = parseItineraryInput(req.body);
    if (!itinerary)
        return res.status(400).json({ message: 'Nieprawidłowe dane wycieczki.' });
    try {
        insertItinerary(itinerary);
        const created = getOne('SELECT * FROM itineraries WHERE slug = ?', [itinerary.slug]);
        res.status(201).json(created ? normalizeItinerary(created) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się dodać wycieczki. Sprawdź unikalny slug.', error: String(error) });
    }
});
app.put('/api/admin/itineraries/:id', requireManager, (req, res) => {
    const id = Number(req.params.id);
    const existing = getOne('SELECT * FROM itineraries WHERE id = ?', [id]);
    if (!existing)
        return res.status(404).json({ message: 'Nie znaleziono wycieczki.' });
    const itinerary = parseItineraryInput(req.body);
    if (!itinerary)
        return res.status(400).json({ message: 'Nieprawidłowe dane wycieczki.' });
    try {
        updateItinerary(id, itinerary);
        const updated = getOne('SELECT * FROM itineraries WHERE id = ?', [id]);
        res.json(updated ? normalizeItinerary(updated) : null);
    }
    catch (error) {
        res.status(409).json({ message: 'Nie udało się zaktualizować wycieczki.', error: String(error) });
    }
});
app.delete('/api/admin/itineraries/:id', requireManager, (req, res) => {
    run('DELETE FROM itineraries WHERE id = ?', [Number(req.params.id)]);
    res.status(204).send();
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const clientDist = path.resolve(serverRoot, '../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}
app.listen(port, () => {
    console.log(`API działa na http://localhost:${port}`);
});
const loginAttempts = new Map();
const maxLoginAttempts = 5;
const loginWindowMs = 15 * 60 * 1000;
function securityHeaders(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    next();
}
function clientKey(req) {
    return req.ip || req.socket.remoteAddress || 'unknown';
}
function isLoginBlocked(req) {
    const key = clientKey(req);
    const entry = loginAttempts.get(key);
    if (!entry)
        return false;
    if (Date.now() > entry.resetAt) {
        loginAttempts.delete(key);
        return false;
    }
    return entry.count >= maxLoginAttempts;
}
function registerLoginFailure(req) {
    const key = clientKey(req);
    const now = Date.now();
    const current = loginAttempts.get(key);
    if (!current || now > current.resetAt) {
        loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs });
        return;
    }
    loginAttempts.set(key, { ...current, count: current.count + 1 });
}
function clearLoginFailures(req) {
    loginAttempts.delete(clientKey(req));
}
function parsePlaceInput(body) {
    const slug = cleanString(body.slug);
    const name = cleanString(body.name);
    const category = cleanString(body.category);
    const shortDescription = cleanString(body.shortDescription);
    const description = cleanString(body.description);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const sourceLabel = cleanString(body.sourceLabel);
    const sourceUrl = cleanString(body.sourceUrl);
    if (!slug || !name || !category || !shortDescription || !description || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !sourceLabel || !sourceUrl) {
        return null;
    }
    return {
        slug,
        name,
        category,
        shortDescription,
        description,
        latitude,
        longitude,
        address: cleanString(body.address) || undefined,
        openingHours: cleanString(body.openingHours) || undefined,
        ticketInfo: cleanString(body.ticketInfo) || undefined,
        website: cleanString(body.website) || undefined,
        phone: cleanString(body.phone) || undefined,
        imageUrl: cleanString(body.imageUrl) || undefined,
        sourceLabel,
        sourceUrl,
        tags: normalizeTags(body.tags),
        isFeatured: Boolean(body.isFeatured),
        funFact: cleanString(body.funFact) || undefined,
        photos: normalizePhotos(body.photos)
    };
}
function normalizeTags(value) {
    if (Array.isArray(value))
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    return String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function parseRole(value) {
    const role = String(value ?? 'user');
    if (role === 'admin' || role === 'moderator' || role === 'user')
        return role;
    return 'user';
}
function normalizePhotos(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((photo) => {
        const raw = photo;
        return {
            url: cleanString(raw.url),
            caption: cleanString(raw.caption) || undefined,
            sourceLabel: cleanString(raw.sourceLabel) || undefined,
            sourceUrl: cleanString(raw.sourceUrl) || undefined,
            isMain: Boolean(raw.isMain)
        };
    })
        .filter((photo) => photo.url);
}
function parseRouteInput(body) {
    const slug = cleanString(body.slug);
    const title = cleanString(body.title);
    const type = cleanString(body.type);
    const distanceKm = Number(body.distanceKm);
    const duration = cleanString(body.duration);
    const difficulty = cleanString(body.difficulty);
    const description = cleanString(body.description);
    const sourceLabel = cleanString(body.sourceLabel);
    const sourceUrl = cleanString(body.sourceUrl);
    const points = normalizeRoutePoints(body.points);
    if (!slug ||
        !title ||
        !['walking', 'cycling', 'trail'].includes(type) ||
        !Number.isFinite(distanceKm) ||
        !duration ||
        !['łatwa', 'średnia', 'trudna'].includes(difficulty) ||
        !description ||
        !sourceLabel ||
        !sourceUrl ||
        points.length < 2) {
        return null;
    }
    return { slug, title, type, distanceKm, duration, difficulty, description, points, sourceLabel, sourceUrl };
}
function parseItineraryInput(body) {
    const slug = cleanString(body.slug);
    const title = cleanString(body.title);
    const type = cleanString(body.type);
    const description = cleanString(body.description);
    const days = Array.isArray(body.days) ? body.days : [];
    if (!slug || !title || !['one_day', 'two_day'].includes(type) || !description || days.length === 0) {
        return null;
    }
    return { slug, title, type, description, days: days };
}
function normalizeRoutePoints(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((point) => {
        const raw = point;
        return {
            name: cleanString(raw.name),
            latitude: Number(raw.latitude),
            longitude: Number(raw.longitude)
        };
    })
        .filter((point) => point.name && Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}
function cleanString(value) {
    return String(value ?? '').trim();
}
function publicUser(user) {
    return { id: user.id, email: user.email, role: user.role, createdAt: user.created_at };
}
function categoryLabel(category) {
    const labels = {
        attraction: 'Atrakcje',
        monument: 'Zabytki',
        nature: 'Przyroda',
        museum: 'Muzea',
        restaurant: 'Restauracje',
        lodging: 'Noclegi',
        viewpoint: 'Punkty widokowe',
        history: 'Historia'
    };
    return labels[category] ?? category;
}
