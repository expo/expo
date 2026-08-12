import { agentEval, expect } from './eval-kit';

// The seeded src/db.ts interpolates user input into a SQL string. A correct
// fix binds the parameter (?/$ placeholders or the db.sql tagged template).
// Escaping the apostrophe by hand would stop the crash but keep the injection.
agentEval(
  import.meta.url,
  {
    title: 'fix the crashing (and injectable) search query',
    prompt: `Users report that searching notes crashes the app when the search text contains an apostrophe, like "don't". The search code is in src/db.ts. Please fix it properly.`,
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

export async function searchNotesAsync(query: string): Promise<Note[]> {
  const database = await getDatabaseAsync();
  return await database.getAllAsync<Note>(\`SELECT * FROM notes WHERE text LIKE '%\${query}%'\`);
}
`,
        'App.tsx': `import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { searchNotesAsync, type Note } from './src/db';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);

  const search = async (text: string) => {
    setQuery(text);
    setResults(text ? await searchNotesAsync(text) : []);
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Search notes</Text>
      <TextInput
        value={query}
        onChangeText={search}
        placeholder="Search"
        style={{ borderWidth: 1, padding: 8 }}
      />
      <FlatList
        data={results}
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
    check('searchNotesAsync still exists', (ws) => {
      expect(ws.read('src/db.ts')).toMatch(
        /export\s+(async\s+)?function\s+searchNotesAsync|export\s+const\s+searchNotesAsync/
      );
    });

    // `${...}` inside a quoted SQL string passed to the string-source APIs.
    check('no user input interpolated into SQL strings', (ws) => {
      expect(ws.source()).not.toMatch(
        /(getAllAsync|getFirstAsync|getEachAsync|runAsync|execAsync)\s*(<[^>]*>)?\(\s*`[^`]*'[^`]*\$\{/
      );
    });

    check('binds the search term as a parameter', (ws) => {
      const usesBinding =
        /(getAllAsync|getFirstAsync|getEachAsync|runAsync)\s*(<[^>]*>)?\(\s*['"`][^'"`]*[?$]/.test(
          ws.source()
        ) ||
        /\.sql[<`]/.test(ws.source()) ||
        /prepareAsync\(/.test(ws.source());
      expect(usesBinding).toBe(true);
    });

    // A string replace of apostrophes fixes the crash but keeps the injection.
    check('does not hand-escape quotes instead of binding', (ws) => {
      expect(ws.read('src/db.ts')).not.toMatch(/\.replace\s*\([^)]*'[^)]*\)\s*[^;]*(LIKE|SELECT)/i);
    });
  }
);
