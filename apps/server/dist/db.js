import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedItineraries, seedPlacePhotos, seedPlaces, seedRoutes } from './seedData.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const defaultDbPath = path.join(serverRoot, 'data', 'ciezkowice.sqlite');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
export function initializeSchema() {
    db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      opening_hours TEXT,
      ticket_info TEXT,
      website TEXT,
      phone TEXT,
      image_url TEXT,
      source_label TEXT NOT NULL,
      source_url TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      fun_fact TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS place_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      source_label TEXT,
      source_url TEXT,
      is_main INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      distance_km REAL NOT NULL,
      duration TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL,
      points_json TEXT NOT NULL,
      source_label TEXT NOT NULL,
      source_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      days_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL,
      place_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, place_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
    migrateUsersRoleSchema();
}
function migrateUsersRoleSchema() {
    const schema = getOne("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'");
    if (!schema?.sql.includes('CHECK'))
        return;
    const rows = getAll('SELECT id, email, password_hash, role, created_at FROM users');
    db.exec('PRAGMA foreign_keys = OFF;');
    try {
        db.exec('DROP TABLE IF EXISTS users_new;');
        db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
        const insert = db.prepare('INSERT INTO users_new (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
        rows.forEach((row) => insert.run(row.id, row.email, row.password_hash, row.role, row.created_at));
        db.exec('DROP TABLE users;');
        db.exec('ALTER TABLE users_new RENAME TO users;');
    }
    finally {
        db.exec('PRAGMA foreign_keys = ON;');
    }
}
export function getOne(sql, params = []) {
    return db.prepare(sql).get(...params);
}
export function getAll(sql, params = []) {
    return db.prepare(sql).all(...params);
}
export function run(sql, params = []) {
    return db.prepare(sql).run(...params);
}
export function normalizePlace(row) {
    const photos = getPhotosForPlace(row.id).map(normalizePhoto);
    const mainPhoto = photos.find((photo) => photo.isMain) ?? photos[0];
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        shortDescription: row.short_description,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        openingHours: row.opening_hours,
        ticketInfo: row.ticket_info,
        website: row.website,
        phone: row.phone,
        imageUrl: mainPhoto?.url ?? row.image_url,
        sourceLabel: row.source_label,
        sourceUrl: row.source_url,
        tags: safeJson(row.tags, []),
        isFeatured: Boolean(row.is_featured),
        funFact: row.fun_fact,
        photos,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
export function normalizePhoto(row) {
    return {
        id: row.id,
        placeId: row.place_id,
        url: row.url,
        caption: row.caption,
        sourceLabel: row.source_label,
        sourceUrl: row.source_url,
        isMain: Boolean(row.is_main),
        createdAt: row.created_at
    };
}
export function getPhotosForPlace(placeId) {
    return getAll('SELECT * FROM place_photos WHERE place_id = ? ORDER BY is_main DESC, id ASC', [placeId]);
}
export function normalizeRoute(row) {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        distanceKm: row.distance_km,
        duration: row.duration,
        difficulty: row.difficulty,
        description: row.description,
        points: safeJson(row.points_json, []),
        sourceLabel: row.source_label,
        sourceUrl: row.source_url
    };
}
export function normalizeItinerary(row) {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        description: row.description,
        days: safeJson(row.days_json, [])
    };
}
export function insertPlace(place) {
    const result = run(`INSERT INTO places (
      slug, name, category, short_description, description, latitude, longitude,
      address, opening_hours, ticket_info, website, phone, image_url, source_label,
      source_url, tags, is_featured, fun_fact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        place.slug,
        place.name,
        place.category,
        place.shortDescription,
        place.description,
        place.latitude,
        place.longitude,
        place.address ?? null,
        place.openingHours ?? null,
        place.ticketInfo ?? null,
        place.website ?? null,
        place.phone ?? null,
        place.imageUrl ?? null,
        place.sourceLabel,
        place.sourceUrl,
        JSON.stringify(place.tags),
        place.isFeatured ? 1 : 0,
        place.funFact ?? null
    ]);
    const id = Number(result.lastInsertRowid);
    replacePlacePhotos(id, place.photos ?? []);
}
export function updatePlace(id, place) {
    run(`UPDATE places SET
      slug = ?, name = ?, category = ?, short_description = ?, description = ?,
      latitude = ?, longitude = ?, address = ?, opening_hours = ?, ticket_info = ?,
      website = ?, phone = ?, image_url = ?, source_label = ?, source_url = ?,
      tags = ?, is_featured = ?, fun_fact = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`, [
        place.slug,
        place.name,
        place.category,
        place.shortDescription,
        place.description,
        place.latitude,
        place.longitude,
        place.address ?? null,
        place.openingHours ?? null,
        place.ticketInfo ?? null,
        place.website ?? null,
        place.phone ?? null,
        place.imageUrl ?? null,
        place.sourceLabel,
        place.sourceUrl,
        JSON.stringify(place.tags),
        place.isFeatured ? 1 : 0,
        place.funFact ?? null,
        id
    ]);
    replacePlacePhotos(id, place.photos ?? []);
}
export function replacePlacePhotos(placeId, photos) {
    run('DELETE FROM place_photos WHERE place_id = ?', [placeId]);
    photos
        .filter((photo) => photo.url)
        .forEach((photo, index) => insertPlacePhoto(placeId, { ...photo, isMain: photo.isMain ?? index === 0 }));
}
export function insertPlacePhoto(placeId, photo) {
    run(`INSERT INTO place_photos (place_id, url, caption, source_label, source_url, is_main) VALUES (?, ?, ?, ?, ?, ?)`, [placeId, photo.url, photo.caption ?? null, photo.sourceLabel ?? null, photo.sourceUrl ?? null, photo.isMain ? 1 : 0]);
}
export function insertRoute(route) {
    run(`INSERT INTO routes (slug, title, type, distance_km, duration, difficulty, description, points_json, source_label, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        route.slug,
        route.title,
        route.type,
        route.distanceKm,
        route.duration,
        route.difficulty,
        route.description,
        JSON.stringify(route.points),
        route.sourceLabel,
        route.sourceUrl
    ]);
}
export function updateRoute(id, route) {
    run(`UPDATE routes SET
      slug = ?, title = ?, type = ?, distance_km = ?, duration = ?, difficulty = ?,
      description = ?, points_json = ?, source_label = ?, source_url = ?
    WHERE id = ?`, [
        route.slug,
        route.title,
        route.type,
        route.distanceKm,
        route.duration,
        route.difficulty,
        route.description,
        JSON.stringify(route.points),
        route.sourceLabel,
        route.sourceUrl,
        id
    ]);
}
export function insertItinerary(itinerary) {
    run(`INSERT INTO itineraries (slug, title, type, description, days_json) VALUES (?, ?, ?, ?, ?)`, [itinerary.slug, itinerary.title, itinerary.type, itinerary.description, JSON.stringify(itinerary.days)]);
}
export function updateItinerary(id, itinerary) {
    run(`UPDATE itineraries SET slug = ?, title = ?, type = ?, description = ?, days_json = ? WHERE id = ?`, [itinerary.slug, itinerary.title, itinerary.type, itinerary.description, JSON.stringify(itinerary.days), id]);
}
export function seedIfEmpty() {
    initializeSchema();
    seedDefaultSettings();
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ciezkowice.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const admin = getOne('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (!admin) {
        run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [
            adminEmail,
            bcrypt.hashSync(adminPassword, 10),
            'admin'
        ]);
    }
    const placesCount = getOne('SELECT COUNT(*) AS count FROM places')?.count ?? 0;
    if (placesCount === 0) {
        seedPlaces.forEach(insertPlace);
    }
    const photosCount = getOne('SELECT COUNT(*) AS count FROM place_photos')?.count ?? 0;
    if (photosCount === 0) {
        seedPlacePhotos.forEach((entry) => {
            const place = getOne('SELECT * FROM places WHERE slug = ?', [entry.placeSlug]);
            if (place)
                replacePlacePhotos(place.id, entry.photos);
        });
    }
    const routesCount = getOne('SELECT COUNT(*) AS count FROM routes')?.count ?? 0;
    if (routesCount === 0) {
        seedRoutes.forEach(insertRoute);
    }
    const itinerariesCount = getOne('SELECT COUNT(*) AS count FROM itineraries')?.count ?? 0;
    if (itinerariesCount === 0) {
        seedItineraries.forEach(insertItinerary);
    }
}
export function getAppSettings() {
    const rows = getAll('SELECT key, value FROM app_settings');
    const data = Object.fromEntries(rows.map((row) => [row.key, parseSetting(row.value)]));
    return {
        appTitle: String(data.appTitle ?? 'Przewodnik Ciężkowice'),
        appSubtitle: String(data.appSubtitle ?? 'PWA • mapa • trasy • historia'),
        contactEmail: String(data.contactEmail ?? ''),
        contactPhone: String(data.contactPhone ?? ''),
        englishEnabled: Boolean(data.englishEnabled ?? true)
    };
}
export function updateAppSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
        if (value === undefined)
            return;
        run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    });
}
function seedDefaultSettings() {
    const defaults = {
        appTitle: 'Przewodnik Ciężkowice',
        appSubtitle: 'PWA • mapa • trasy • historia',
        contactEmail: 'kontakt@ciezkowice.local',
        contactPhone: '+48 14 62 85 800',
        englishEnabled: true
    };
    Object.entries(defaults).forEach(([key, value]) => {
        const existing = getOne('SELECT * FROM app_settings WHERE key = ?', [key]);
        if (!existing)
            run('INSERT INTO app_settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    });
}
function parseSetting(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
function safeJson(value, fallback) {
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
