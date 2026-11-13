import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(root, 'apps', 'server', 'data', 'ciezkowice.sqlite');

const email = (process.argv[2] ?? 'admin@ciezkowice.local').trim().toLowerCase();
const password = process.argv[3] ?? 'admin123';

if (password.length < 6) {
  console.error('Hasło musi mieć minimum 6 znaków.');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
const hash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE email = ?').run(hash, 'admin', email);
  console.log(`Zresetowano hasło administratora: ${email}`);
} else {
  db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hash, 'admin');
  console.log(`Utworzono konto administratora: ${email}`);
}

console.log(`Nowe hasło: ${password}`);
