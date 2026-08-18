import * as SQLite from 'expo-sqlite';

export interface Tag {
  id: number;
  name: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function openAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL)'
    );
  }
  return db;
}

export async function listTagsAsync(): Promise<Tag[]> {
  const database = await openAsync();
  return await database.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name');
}

export async function addTagAsync(name: string): Promise<void> {
  const database = await openAsync();
  await database.runAsync('INSERT INTO tags (name) VALUES (?)', name);
}
