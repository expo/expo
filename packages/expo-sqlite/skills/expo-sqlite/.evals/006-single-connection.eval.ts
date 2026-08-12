import { agentEval, expect, loadAstSupport } from './eval-kit';

// Demonstrates an AST check for a rule regex can't verify honestly: counting
// real openDatabaseAsync call sites. A regex over source can be fooled by the
// word appearing in strings, and can't tell a call from a mention; the AST
// counts CallExpression nodes. The seed opens two separate connections.
agentEval(
  import.meta.url,
  {
    title: 'consolidate to a single shared database connection',
    prompt: `src/notes.ts and src/tags.ts each open their own database connection with openDatabaseAsync. Refactor so the app opens one shared connection and everything reuses it.`,
    seed: {
      files: {
        'src/notes.ts': `import * as SQLite from 'expo-sqlite';

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
`,
        'src/tags.ts': `import * as SQLite from 'expo-sqlite';

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
`,
        'App.tsx': `import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/notes';
import { listTagsAsync, type Tag } from './src/tags';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    listNotesAsync().then(setNotes);
    listTagsAsync().then(setTags);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes ({tags.length} tags)</Text>
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
    // Lexical tier: cheap approximation that always runs. Counts textual
    // occurrences in comment-stripped source — a string mentioning the API
    // would fool it, which is exactly what the AST tier below is for.
    check('opens exactly one database connection (lexical)', (ws) => {
      const occurrences = ws.source().match(/openDatabaseAsync\s*\(/g) ?? [];
      expect(occurrences).toHaveLength(1);
    });

    // AST tier: exactly one real openDatabaseAsync call site across the app.
    check('opens exactly one database connection (AST)', async (ws, { skip }) => {
      const ast = await loadAstSupport();
      if (!ast) {
        skip('@babel/parser not installed — run npm install in .evals/');
        return;
      }
      let callSites = 0;
      for (const file of ws.sourceFiles()) {
        ast.walk(ast.parse(file.contents, file.path), (node) => {
          if (node.type !== 'CallExpression') {
            return;
          }
          const callee = node.callee;
          const name =
            callee?.type === 'Identifier'
              ? callee.name
              : callee?.type === 'MemberExpression' && !callee.computed
                ? callee.property?.name
                : undefined;
          if (name === 'openDatabaseAsync') {
            callSites++;
          }
        });
      }
      expect(callSites).toBe(1);
    });

    check('notes and tags APIs preserved', (ws) => {
      for (const name of ['listNotesAsync', 'addNoteAsync', 'listTagsAsync', 'addTagAsync']) {
        expect(ws.source()).toContain(name);
      }
    });

    check('still binds parameters for writes', (ws) => {
      const bindsParameters =
        /runAsync\(\s*['"][^'"]*[?$]/.test(ws.source()) || /\.sql[<`]/.test(ws.source());
      expect(bindsParameters).toBe(true);
    });
  }
);
