import { agentEval, expect, type EvalWorkspace } from './eval-kit';

// Atomic bulk insert while other queries run concurrently: the skill's
// guidance is withExclusiveTransactionAsync (plain withTransactionAsync lets
// unrelated in-flight queries join the transaction) and prepared statements
// finalized in a finally block for the hot loop.
//
// The seeded src/db.ts already opens the database and lists notes, so checks
// are scoped to the file(s) defining importNotesAsync — seeded code cannot
// pass checks on the agent's behalf.
function importSource(ws: EvalWorkspace): string {
  return ws
    .sourceFiles()
    .filter((f) => /importNotesAsync/.test(f.contents))
    .map((f) => f.contents)
    .join('\n');
}

agentEval(
  import.meta.url,
  {
    title: 'import thousands of rows atomically',
    prompt: `Add an importNotesAsync(texts: string[]) function to this app that inserts up to a few thousand notes at once. If any row fails, none of them should be saved. It runs while the rest of the app keeps querying the database, and it should be reasonably fast.`,
    seed: {
      files: {
        'src/db.ts': `import * as SQLite from 'expo-sqlite';

export interface Note {
  id: number;
  text: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabaseAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('notes.db');
    await db.execAsync(\`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY NOT NULL, text TEXT NOT NULL);
\`);
  }
  return db;
}

export async function listNotesAsync(): Promise<Note[]> {
  const database = await getDatabaseAsync();
  return await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY id DESC');
}
`,
        'App.tsx': `import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { listNotesAsync, type Note } from './src/db';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      // The list refreshes on an interval, so queries run while imports happen.
      listNotesAsync().then(setNotes);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Notes ({notes.length})</Text>
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
    check('importNotesAsync exists', (ws) => {
      expect(importSource(ws)).not.toBe('');
    });

    check('wraps the import in a transaction', (ws) => {
      expect(importSource(ws)).toMatch(/withExclusiveTransactionAsync\(|withTransactionAsync\(/);
    });

    // Concurrent queries elsewhere would silently join a plain withTransactionAsync.
    check('uses the exclusive transaction variant', (ws) => {
      expect(importSource(ws)).toMatch(/withExclusiveTransactionAsync\(/);
    });

    check('binds row values as parameters', (ws) => {
      const source = importSource(ws);
      const bindsParameters =
        /(runAsync|executeAsync)\s*(<[^>]*>)?\(\s*[^)]*[?$]/.test(source) ||
        /\.sql[<`]/.test(source);
      expect(bindsParameters).toBe(true);
    });

    // Engagement-gated: only meaningful when a prepared statement is used at all.
    check('finalizes the prepared statement in finally', (ws, { skip }) => {
      const source = importSource(ws);
      if (!/prepareAsync\(/.test(source)) {
        skip('no prepared statement used');
      }
      expect(source).toMatch(/finally\s*{[^}]*finalize(Async|Sync)\(/s);
    });
  }
);
