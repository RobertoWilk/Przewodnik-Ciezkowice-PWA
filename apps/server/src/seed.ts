import 'dotenv/config';
import { seedIfEmpty } from './db.js';

seedIfEmpty();
console.log('Baza danych została przygotowana.');
