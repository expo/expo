---
name: expo-sqlite
description: Persist and query local data in an Expo or React Native app with expo-sqlite. Covers opening databases (openDatabaseAsync, SQLiteProvider/useSQLiteContext), parameterized CRUD (runAsync, getFirstAsync, getAllAsync, getEachAsync), the db.sql tagged-template API, prepared statements, schema migrations with PRAGMA user_version, transactions, key-value storage (expo-sqlite/kv-store as an AsyncStorage replacement), the localStorage polyfill, SQLCipher, and web (wasm) setup. Use when adding offline storage, a local database, caching, or replacing AsyncStorage in an Expo app.
version: 1.0.0
license: MIT
---

# expo-sqlite

Local SQLite database for Expo apps. Works on Android, iOS, macOS, tvOS, web, and in Expo Go. Data persists across app restarts.

## When to use

- Store structured data on device (offline-first apps, caches, drafts, queues).
- Replace `@react-native-async-storage/async-storage` with `expo-sqlite/kv-store`.
- Share storage code with web through the `localStorage` polyfill.
- Use Drizzle ORM or Knex.js on top of a local database.

Install with `npx expo install expo-sqlite`. Web needs extra Metro config — see [references/web-and-config.md](references/web-and-config.md).

## Choose the right API

| Task                                          | API                                                            |
| --------------------------------------------- | -------------------------------------------------------------- |
| One-time DDL / bulk statements, no user input | `db.execAsync(source)`                                         |
| Writes (`INSERT`/`UPDATE`/`DELETE`)           | `db.runAsync(source, params)` → `{ lastInsertRowId, changes }` |
| Read one row                                  | `db.getFirstAsync<T>(source, params)`                          |
| Read all rows                                 | `db.getAllAsync<T>(source, params)`                            |
| Iterate large results                         | `for await (const row of db.getEachAsync<T>(source, params))`  |
| Typed, concise queries                        | `` db.sql<T>`SELECT ...` `` tagged template                    |
| Repeated query, hot path                      | `db.prepareAsync(source)` + `statement.executeAsync(params)`   |

Every method also has a `Sync` variant (`runSync`, `getAllSync`, …). Prefer the async APIs; synchronous calls block the JS thread.

## Security: always bind parameters

`execAsync()` does not escape parameters. Never interpolate user input into SQL strings. Bind values instead:

```ts
// Variadic, array, or named parameters
await db.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'aaa', 100);
await db.runAsync('UPDATE test SET intValue = ? WHERE value = ?', [999, 'aaa']);
await db.runAsync('DELETE FROM test WHERE value = $value', { $value: 'aaa' });
```

The `db.sql` tagged template binds every `${value}` automatically, so interpolation is safe there:

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

const sql = db.sql;
const users = await sql<User>`SELECT * FROM users WHERE age > ${age}`; // User[]
const user = await sql<User>`SELECT * FROM users WHERE id = ${1}`.first();
const result =
  (await sql`INSERT INTO users (name, age) VALUES (${'Alice'}, ${30})`) as SQLite.SQLiteRunResult;
```

## React integration

Wrap the app in `SQLiteProvider` and read the database with `useSQLiteContext()`:

```tsx
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

export default function App() {
  return (
    <SQLiteProvider databaseName="app.db" onInit={migrateDbIfNeeded}>
      <Main />
    </SQLiteProvider>
  );
}

function Main() {
  const db = useSQLiteContext();
  // db.getAllAsync(...), db.runAsync(...), ...
}
```

- `onInit` runs before children render — put migrations there.
- `useSuspense` integrates with `React.Suspense` (wrap the provider in `<Suspense fallback={...}>`).
- `assetSource={{ assetId: require('./assets/app.db') }}` opens a bundled database file.
- Outside React, open with `const db = await SQLite.openDatabaseAsync('app.db')`.

## Migrations with PRAGMA user_version

Version the schema with SQLite's built-in `user_version` so setup runs once and upgrades are incremental:

```ts
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
CREATE TABLE todos (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
`);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) { ...next migration... }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

Enable WAL journal mode when creating a new database — it improves performance in general.

## Transactions

`withTransactionAsync(task)` runs `task` inside a transaction, but any query that happens to run while the transaction is active joins it — including queries started elsewhere. When that matters, use `withExclusiveTransactionAsync`: only queries made through its `txn` argument are inside the transaction:

```ts
await db.withExclusiveTransactionAsync(async (txn) => {
  await txn.execAsync('UPDATE test SET name = "aaa"');
});
```

A throw inside either callback rolls the transaction back.

## Prepared statements

Finalize statements when done — use `try`/`finally`:

```ts
const statement = await db.prepareAsync(
  'INSERT INTO test (value, intValue) VALUES ($value, $intValue)'
);
try {
  await statement.executeAsync({ $value: 'bbb', $intValue: 101 });
  await statement.executeAsync({ $value: 'ccc', $intValue: 102 });
} finally {
  await statement.finalizeAsync();
}
```

`executeAsync<T>()` returns a result that is an async iterable and supports `getFirstAsync()`, `getAllAsync()`, and `resetAsync()` (reset the cursor before reading again).

## Key-value storage

`expo-sqlite/kv-store` is a drop-in replacement for `@react-native-async-storage/async-storage`, with added synchronous variants:

```diff
- import AsyncStorage from '@react-native-async-storage/async-storage';
+ import AsyncStorage from 'expo-sqlite/kv-store';
```

```ts
import Storage from 'expo-sqlite/kv-store';

await Storage.setItem('key', JSON.stringify({ entity: 'value' }));
const value = Storage.getItemSync('key'); // synchronous variant
```

If the project already depends on expo-sqlite, prefer this over adding the async-storage dependency.

For web-style code, `import 'expo-sqlite/localStorage/install'` installs a `globalThis.localStorage` backed by SQLite (a no-op on web, excluded from production web bundles).

## Binary data

Bind `Uint8Array` values directly for `BLOB` columns:

```ts
await db.runAsync('INSERT INTO blobs (data) VALUES (?)', new Uint8Array([0x00, 0x01]));
const row = await db.getFirstAsync<{ data: Uint8Array }>('SELECT * FROM blobs');
```

## Common mistakes

- Interpolating user input into `execAsync()`/`runAsync()` SQL strings instead of binding parameters.
- Adding `@react-native-async-storage/async-storage` when `expo-sqlite/kv-store` already covers the need.
- Running `CREATE TABLE` on every launch instead of versioning with `PRAGMA user_version` (use `CREATE TABLE IF NOT EXISTS` only for trivial schemas).
- Forgetting `finalizeAsync()` on prepared statements.
- Expecting `withTransactionAsync` to isolate concurrent queries — use `withExclusiveTransactionAsync`.
- Shipping to web without the Metro wasm config and `COEP`/`COOP` headers ([references/web-and-config.md](references/web-and-config.md)).
- Using SQLCipher in Expo Go — it requires a development build.

## Debugging

The library ships a DevTools inspector: press <kbd>Shift</kbd> + <kbd>M</kbd> in the Expo CLI terminal, then select **Open expo-sqlite** to browse tables, edit rows, and run queries from the browser. No setup needed in development.

## Deeper topics

- [references/web-and-config.md](references/web-and-config.md) — web (wasm) setup, config plugin options (`enableFTS`, `useSQLCipher`, `withSQLiteVecExtension`, custom build flags), SQLCipher, iOS App Group shared containers, backup/serialization APIs, and change listeners.
