import { agentEval, expect } from './eval-kit';
import { setupProject } from './setup';

// The prompt asks for durable notes plus a schema-evolution story. The skill
// teaches PRAGMA user_version migrations, SQLiteProvider onInit, and
// parameterized writes — these checks verify those idioms landed. The seeded
// app is in-memory only, so any expo-sqlite usage is the agent's.
agentEval(
  import.meta.url,
  {
    title: 'persist notes across restarts, with a migration path',
    prompt: `Notes in this app disappear whenever I restart it. Store them on the device so they survive restarts. We'll definitely add more fields to notes later, so set the storage up in a way that lets us change the schema without wiping people's existing notes.`,
    projectSetup: setupProject({ fixture: 'notes-in-memory' }),
  },
  (check) => {
    check('imports expo-sqlite', (ws) => {
      expect(ws.source()).toMatch(/from ['"]expo-sqlite['"]/);
    });

    check('opens the database through the supported entry points', (ws) => {
      expect(ws.source()).toMatch(/openDatabaseAsync\(|<SQLiteProvider[\s/>]/);
    });

    // CREATE TABLE on every launch has no upgrade path for existing data.
    check('versions the schema with PRAGMA user_version', (ws) => {
      expect(ws.source()).toMatch(/PRAGMA user_version/i);
    });

    // runAsync with ?/$ placeholders, or the db.sql tagged template.
    check('binds parameters instead of interpolating values into SQL', (ws) => {
      const bindsParameters =
        /runAsync\(\s*['"][^'"]*[?$]/.test(ws.source()) || /\.sql[<`]/.test(ws.source());
      expect(bindsParameters).toBe(true);
    });

    check('does not add an async-storage dependency for structured data', (ws) => {
      expect(
        ws.packageJson()?.dependencies?.['@react-native-async-storage/async-storage']
      ).toBeUndefined();
    });
  }
);
