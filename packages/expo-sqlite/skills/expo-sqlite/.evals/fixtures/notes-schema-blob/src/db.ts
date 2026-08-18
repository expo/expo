import * as SQLite from 'expo-sqlite';

export interface Note {
  id: number;
  text: string;
  tagId: number | null;
}

export interface Tag {
  id: number;
  name: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
    // Every schema change so far, in one ever-growing blob.
    await db.execAsync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL);
ALTER TABLE notes ADD COLUMN tagId INTEGER REFERENCES tags(id);
CREATE INDEX IF NOT EXISTS idx_notes_tag ON notes(tagId);
`);
  }
  return db;
}

export async function listNotesAsync(): Promise<Note[]> {
  const database = await getDatabaseAsync();
  return await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY id DESC');
}

export async function listTagsAsync(): Promise<Tag[]> {
  const database = await getDatabaseAsync();
  return await database.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name');
}
