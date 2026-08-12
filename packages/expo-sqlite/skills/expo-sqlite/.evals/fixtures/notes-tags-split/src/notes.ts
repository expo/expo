import * as SQLite from 'expo-sqlite';

export interface Note {
  id: number;
  text: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function openAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL)'
    );
  }
  return db;
}

export async function listNotesAsync(): Promise<Note[]> {
  const database = await openAsync();
  return await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY id DESC');
}

export async function addNoteAsync(text: string): Promise<void> {
  const database = await openAsync();
  await database.runAsync('INSERT INTO notes (text) VALUES (?)', text);
}
