import { agentEval, expect } from './eval-kit';

// Demonstrates directory-structure checks (ws.glob) alongside lexical ones.
// The seed keeps all DDL in one growing execAsync blob; the ask is ordered
// per-change migration files plus tracking of what has been applied.
agentEval(
  import.meta.url,
  {
    title: 'split inline schema setup into ordered migration files',
    prompt: `Our whole database schema lives in one execAsync blob in src/db.ts and it keeps growing. Restructure it: put each schema change in its own ordered migration file under src/db/migrations, apply the pending ones at startup, and keep track of which migrations have already run so we can safely add more later.`,
    seed: {
      files: {
        'src/db.ts': `import * as SQLite from 'expo-sqlite';

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
    await db.execAsync(\`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL);
ALTER TABLE notes ADD COLUMN tagId INTEGER REFERENCES tags(id);
CREATE INDEX IF NOT EXISTS idx_notes_tag ON notes(tagId);
\`);
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
`,
        'App.tsx': `import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/db';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    listNotesAsync().then(setNotes);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes</Text>
      <FlatList
        data={notes}
        keyExtractor={(note) => String(note.id)}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
`,
      },
    },
  },
  (check) => {
    // Structure: migration files exist where the prompt asked for them.
    check('creates migration files under src/db/migrations', (ws) => {
      expect(ws.glob('src/db/migrations/*.{ts,tsx,js,sql}').length).toBeGreaterThan(0);
    });

    // Structure: every migration filename starts with an order prefix.
    // Engagement-gated: with no migration files there is nothing to order.
    check('migration filenames are ordered', (ws, { skip }) => {
      const files = ws.glob('src/db/migrations/*.{ts,tsx,js,sql}');
      if (files.length === 0) {
        skip('no migration files');
        return;
      }
      const ordered = files.filter((file) => /^\d+/.test(file.split('/').pop() ?? ''));
      expect(ordered).toEqual(files);
    });

    // PRAGMA user_version or a migrations bookkeeping table both qualify.
    check('tracks which migrations have been applied', (ws) => {
      expect(ws.source()).toMatch(/PRAGMA user_version|migration/i);
    });

    check('inline DDL blob removed from src/db.ts', (ws) => {
      const withoutMigrations = ws
        .sourceFiles()
        .filter((f) => f.path === 'src/db.ts')
        .map((f) => f.contents)
        .join('\n');
      expect(withoutMigrations).not.toMatch(/ALTER TABLE|CREATE INDEX/i);
    });

    check('notes and tags APIs preserved', (ws) => {
      for (const name of ['listNotesAsync', 'listTagsAsync']) {
        expect(ws.source()).toContain(name);
      }
    });
  }
);
