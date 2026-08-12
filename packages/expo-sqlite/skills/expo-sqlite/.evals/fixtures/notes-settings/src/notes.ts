import * as SQLite from 'expo-sqlite';

export interface Note {
  id: number;
  text: string;
}

// The app already uses expo-sqlite for its structured data.
let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('notes.db');
    await db.execAsync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL);
`);
  }
  return db;
}

export async function listNotesAsync(): Promise<Note[]> {
  const database = await getDatabaseAsync();
  return await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY id DESC');
}
