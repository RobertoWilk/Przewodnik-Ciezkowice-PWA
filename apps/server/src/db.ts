import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedItineraries, seedPlacePhotos, seedPlaces, seedRoutes } from './seedData.js';
import type { AppSettingsInput, ItineraryGroupInput, ItineraryInput, PlaceGroupInput, PlaceInput, PlacePhotoInput, RouteGroupInput, RouteInput } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const defaultDbPath = path.join(serverRoot, 'data', 'ciezkowice.sqlite');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

export interface DbPlaceRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  opening_hours: string | null;
  ticket_info: string | null;
  website: string | null;
  phone: string | null;
  image_url: string | null;
  source_label: string;
  source_url: string;
  tags: string;
  is_featured: number;
  fun_fact: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlaceEnRow {
  places_id: number;
  name: string;
  short_description: string;
  description: string;
  opening_hours: string | null;
  ticket_info: string | null;
  tags: string;
  fun_fact: string | null;
}

export interface DbPlacePhotoRow {
  id: number;
  place_id: number;
  url: string;
  caption: string | null;
  source_label: string | null;
  source_url: string | null;
  is_main: number;
  created_at: string;
}

export interface DbRouteRow {
  id: number;
  slug: string;
  title: string;
  type: string;
  distance_km: number;
  duration: string;
  difficulty: string;
  description: string;
  points_json: string;
  source_label: string;
  source_url: string;
}

export interface DbRouteEnRow {
  route_id: number;
  title: string;
  duration: string;
  description: string;
  points_json: string;
}

export interface DbItineraryRow {
  id: number;
  slug: string;
  title: string;
  type: string;
  description: string;
  days_json: string;
}

export interface DbItineraryEnRow {
  itin_id: number;
  title: string;
  description: string;
  days_json: string;
}

export interface DbUserRow {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export interface DbSettingRow {
  key: string;
  value: string;
}

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

    CREATE TABLE IF NOT EXISTS places_en (
      places_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      opening_hours TEXT,
      ticket_info TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      fun_fact TEXT
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

    CREATE TABLE IF NOT EXISTS routes_en (
      route_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      duration TEXT NOT NULL,
      description TEXT NOT NULL,
      points_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      days_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itineraries_en (
      itin_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
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
  const schema = getOne<{ sql: string }>("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'");
  if (!schema?.sql.includes('CHECK')) return;

  const rows = getAll<DbUserRow>('SELECT id, email, password_hash, role, created_at FROM users');
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
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }
}

export function getOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...(params as any[])) as T | undefined;
}

export function getAll<T>(sql: string, params: unknown[] = []): T[] {
  return db.prepare(sql).all(...(params as any[])) as T[];
}

export function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...(params as any[]));
}

export function normalizePlace(row: DbPlaceRow) {
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
    tags: safeJson<string[]>(row.tags, []),
    isFeatured: Boolean(row.is_featured),
    funFact: row.fun_fact,
    photos,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function normalizePlaceLang(row: DbPlaceEnRow) {
  return {
    id: row.places_id,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    openingHours: row.opening_hours,
    ticketInfo: row.ticket_info,
    tags: safeJson<string[]>(row.tags, []),
    funFact: row.fun_fact,
  };
}

export function normalizePhoto(row: DbPlacePhotoRow) {
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

export function getPhotosForPlace(placeId: number) {
  return getAll<DbPlacePhotoRow>('SELECT * FROM place_photos WHERE place_id = ? ORDER BY is_main DESC, id ASC', [placeId]);
}

export function normalizeRoute(row: DbRouteRow) {
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

export function normalizeRouteLang(row: DbRouteEnRow) {
  return {
    id: row.route_id,
    title: row.title,
    duration: row.duration,
    description: row.description,
    points: safeJson(row.points_json, [])
  };
}

export function normalizeItinerary(row: DbItineraryRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    description: row.description,
    days: safeJson(row.days_json, [])
  };
}

export function normalizeItineraryLang(row: DbItineraryEnRow) {
  return {
    itin_id: row.itin_id,
    title: row.title,
    description: row.description,
    days: safeJson(row.days_json, [])
  };
}


export function insertPlace(placeGroup: PlaceGroupInput) {
  const place = placeGroup.pl;
  const placeEn = placeGroup.en;

  run(
    `INSERT INTO places (
      id, slug, name, category, short_description, description, latitude, longitude,
      address, opening_hours, ticket_info, website, phone, image_url, source_label,
      source_url, tags, is_featured, fun_fact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      place.id,
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
    ]
  );

  run(
    `INSERT INTO places (
      place_id, name, short_description, description, opening_hours, ticket_info, tags, fun_fact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      place.id,
      placeEn.name,
      placeEn.shortDescription,
      placeEn.description,
      placeEn.openingHours ?? null,
      placeEn.ticketInfo ?? null,
      JSON.stringify(placeEn.tags),
      placeEn.funFact ?? null
    ]
  )
  
  replacePlacePhotos(place.id, place.photos ?? []);
}

export function updatePlace(id: number, placeGroup: PlaceGroupInput) {
  const place = placeGroup.pl;
  const placeEn = placeGroup.en;
  
  run(
    `UPDATE places SET
      slug = ?, name = ?, category = ?, short_description = ?, description = ?,
      latitude = ?, longitude = ?, address = ?, opening_hours = ?, ticket_info = ?,
      website = ?, phone = ?, image_url = ?, source_label = ?, source_url = ?,
      tags = ?, is_featured = ?, fun_fact = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
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
    ]
  );

  run(
    `UPDATE places_en SET
      name = ?, short_description = ?, description = ?, opening_hours = ?, 
      ticket_info = ?, tags = ?, fun_fact = ?
    WHERE places_id = ?`,
    [
      placeEn.name,
      placeEn.shortDescription,
      placeEn.description,
      placeEn.openingHours ?? null,
      placeEn.ticketInfo ?? null,
      JSON.stringify(placeEn.tags),
      placeEn.funFact ?? null,
      id
    ]
  );

  replacePlacePhotos(id, place.photos ?? []);
}

export function replacePlacePhotos(placeId: number, photos: PlacePhotoInput[]) {
  run('DELETE FROM place_photos WHERE place_id = ?', [placeId]);
  photos
    .filter((photo) => photo.url)
    .forEach((photo, index) => insertPlacePhoto(placeId, { ...photo, isMain: photo.isMain ?? index === 0 }));
}

export function insertPlacePhoto(placeId: number, photo: PlacePhotoInput) {
  run(
    `INSERT INTO place_photos (place_id, url, caption, source_label, source_url, is_main) VALUES (?, ?, ?, ?, ?, ?)`,
    [placeId, photo.url, photo.caption ?? null, photo.sourceLabel ?? null, photo.sourceUrl ?? null, photo.isMain ? 1 : 0]
  );
}

export function insertRoute(routeGroup: RouteGroupInput) {
  const route = routeGroup.pl;
  const routeEn = routeGroup.en;

  run(
    `INSERT INTO routes (id, slug, title, type, distance_km, duration, difficulty, description, points_json, source_label, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      route.id,
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
    ]
  );

  run(
    `INSERT INTO routes_en (route_id, title, duration, description, points_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      routeEn.id,
      routeEn.title,
      routeEn.duration,
      routeEn.description,
      JSON.stringify(routeEn.points),
    ]
  );
}

export function updateRoute(id: number, routeGroup: RouteGroupInput) {
  const route = routeGroup.pl;
  const routeEn = routeGroup.en;

  run(
    `UPDATE routes SET
      slug = ?, title = ?, type = ?, distance_km = ?, duration = ?, difficulty = ?,
      description = ?, points_json = ?, source_label = ?, source_url = ?
    WHERE id = ?`,
    [
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
    ]
  );

  run(
    `UPDATE routes_en SET
      title = ?, duration = ?, description = ?, points_json = ?
    WHERE route_id = ?`,
    [
      routeEn.title,
      routeEn.duration,
      routeEn.description,
      JSON.stringify(routeEn.points),
      id
    ]
  );
}

export function insertItinerary(itineraryGroup: ItineraryGroupInput) {
  const itinerary = itineraryGroup.pl;
  const itineraryEn = itineraryGroup.en;
  run(
    `INSERT INTO itineraries (id, slug, title, type, description, days_json) VALUES (?, ?, ?, ?, ?, ?)`,
    [itinerary.id, itinerary.slug, itinerary.title, itinerary.type, itinerary.description, JSON.stringify(itinerary.days)]
  );
  run(
    `INSERT INTO itineraries_en (itin_id, title, description, days_json) VALUES (?, ?, ?, ?)`,
    [itinerary.id, itineraryEn.title, itineraryEn.description, JSON.stringify(itineraryEn.days)]
  );
}

export function updateItinerary(id: number, itineraryGroup: ItineraryGroupInput) {
  const itinerary = itineraryGroup.pl;
  const itineraryEn = itineraryGroup.en;
  run(
    `UPDATE itineraries SET slug = ?, title = ?, type = ?, description = ?, days_json = ? WHERE id = ?`,
    [itinerary.slug, itinerary.title, itinerary.type, itinerary.description, JSON.stringify(itinerary.days), id]
  );
  run(
    `UPDATE itineraries_en SET title = ?, description = ?, days_json = ? WHERE itin_id = ?`,
    [itineraryEn.title, itineraryEn.description, JSON.stringify(itineraryEn.days), id]
  )
}

export function seedIfEmpty() {
  initializeSchema();
  seedDefaultSettings();

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ciezkowice.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const admin = getOne<DbUserRow>('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!admin) {
    run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [
      adminEmail,
      bcrypt.hashSync(adminPassword, 10),
      'admin'
    ]);
  }

  /*
  const placesCount = getOne<{ count: number }>('SELECT COUNT(*) AS count FROM places')?.count ?? 0;
  if (placesCount === 0) {
    seedPlaces.forEach(insertPlace);
  } */

  const photosCount = getOne<{ count: number }>('SELECT COUNT(*) AS count FROM place_photos')?.count ?? 0;
  if (photosCount === 0) {
    seedPlacePhotos.forEach((entry) => {
      const place = getOne<DbPlaceRow>('SELECT * FROM places WHERE slug = ?', [entry.placeSlug]);
      if (place) replacePlacePhotos(place.id, entry.photos);
    });
  }

  /*
  const routesCount = getOne<{ count: number }>('SELECT COUNT(*) AS count FROM routes')?.count ?? 0;
  if (routesCount === 0) {
    seedRoutes.forEach(insertRoute);
  } */

    /*
  const itinerariesCount = getOne<{ count: number }>('SELECT COUNT(*) AS count FROM itineraries')?.count ?? 0;
  if (itinerariesCount === 0) {
    seedItineraries.forEach(insertItinerary);
  }*/
}

export function getAppSettings() {
  const rows = getAll<DbSettingRow>('SELECT key, value FROM app_settings');
  const data = Object.fromEntries(rows.map((row) => [row.key, parseSetting(row.value)]));
  return {
    appTitle: String(data.appTitle ?? 'Przewodnik Ciężkowice'),
    appSubtitle: String(data.appSubtitle ?? 'PWA • mapa • trasy • historia'),
    contactEmail: String(data.contactEmail ?? ''),
    contactPhone: String(data.contactPhone ?? ''),
    englishEnabled: Boolean(data.englishEnabled ?? true)
  };
}

export function updateAppSettings(settings: AppSettingsInput) {
  Object.entries(settings).forEach(([key, value]) => {
    if (value === undefined) return;
    run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  });
}

function seedDefaultSettings() {
  const defaults: Required<AppSettingsInput> = {
    appTitle: 'Przewodnik Ciężkowice',
    appSubtitle: 'PWA • mapa • trasy • historia',
    contactEmail: 'kontakt@ciezkowice.local',
    contactPhone: '+48 14 62 85 800',
    englishEnabled: true
  };
  Object.entries(defaults).forEach(([key, value]) => {
    const existing = getOne<DbSettingRow>('SELECT * FROM app_settings WHERE key = ?', [key]);
    if (!existing) run('INSERT INTO app_settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  });
}

function parseSetting(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
