import { agentEval, expect } from './eval-kit';

// The skill's guidance: expo-sqlite/kv-store is a drop-in AsyncStorage
// replacement, so removing the dependency should be an import swap — not a
// hand-rolled key-value table.
agentEval(
  import.meta.url,
  {
    title: 'replace async-storage with what expo-sqlite already provides',
    prompt: `We're trimming dependencies. This app already uses expo-sqlite for its notes, but src/settings.ts pulls in @react-native-async-storage/async-storage just for a few key-value settings. Get rid of that extra dependency without changing how settings behave.`,
    seed: {
      dependencies: { '@react-native-async-storage/async-storage': '^2.1.0' },
      files: {
        'src/settings.ts': `import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
}

const SETTINGS_KEY = 'settings';

export async function loadSettingsAsync(): Promise<Settings | null> {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  return value ? (JSON.parse(value) as Settings) : null;
}

export async function saveSettingsAsync(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearSettingsAsync(): Promise<void> {
  await AsyncStorage.removeItem(SETTINGS_KEY);
}
`,
        // The app already uses expo-sqlite for its structured data.
        'src/notes.ts': `import * as SQLite from 'expo-sqlite';

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

import { listNotesAsync, type Note } from './src/notes';
import { loadSettingsAsync, type Settings } from './src/settings';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    listNotesAsync().then(setNotes);
    loadSettingsAsync().then(setSettings);
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: settings?.fontSize ?? 16 }}>Notes</Text>
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
    check('dependency removed from package.json', (ws) => {
      expect(
        ws.packageJson()?.dependencies?.['@react-native-async-storage/async-storage']
      ).toBeUndefined();
    });

    check('no remaining async-storage imports', (ws) => {
      expect(ws.source()).not.toMatch(/@react-native-async-storage\/async-storage/);
    });

    // The drop-in replacement, not a hand-rolled key-value table.
    check('uses expo-sqlite/kv-store', (ws) => {
      expect(ws.read('src/settings.ts')).toMatch(/from ['"]expo-sqlite\/kv-store['"]/);
    });

    check('settings API preserved', (ws) => {
      const settings = ws.read('src/settings.ts');
      for (const name of ['loadSettingsAsync', 'saveSettingsAsync', 'clearSettingsAsync']) {
        expect(settings).toContain(name);
      }
    });
  }
);
