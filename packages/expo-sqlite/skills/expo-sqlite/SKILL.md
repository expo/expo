---
name: expo-sqlite
description: Persist and query local data with expo-sqlite in Expo or React Native apps. Use for SQLite setup, SQL queries, schema migrations, transactions, SQLiteProvider, expo-sqlite/kv-store, or the localStorage polyfill.
license: MIT
---

# expo-sqlite

Use SQLite for structured local data, offline queues, and persistent caches. For simple string key-value storage, use `expo-sqlite/kv-store`. Preserve an existing ORM or storage architecture unless the task calls for changing it.

## Setup and API selection

Install with `npx expo install expo-sqlite`. Check the installed package version and its types before using newer APIs such as `db.sql`. Use the [SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) for the app's SDK version; use [unversioned docs](https://docs.expo.dev/versions/unversioned/sdk/sqlite/) only when working with unreleased code.

The package supports Android, iOS, macOS, tvOS, and web. Standard SQLite is included in Expo Go; custom native build options require rebuilding the app. Web requires additional setup in [references/web-and-config.md](references/web-and-config.md).

| Task                                             | API                                   |
| ------------------------------------------------ | ------------------------------------- |
| Static DDL or multiple SQL statements            | `db.execAsync(source)`                |
| Write and receive `{ lastInsertRowId, changes }` | `db.runAsync(source, params)`         |
| Read one row, or `null` if absent                | `db.getFirstAsync<T>(source, params)` |
| Read a bounded result set                        | `db.getAllAsync<T>(source, params)`   |
| Iterate rows without collecting the full result  | `db.getEachAsync<T>(source, params)`  |
| Concise parameterized queries                    | `` db.sql<T>`SELECT ...` ``           |
| Reuse a compiled statement                       | `db.prepareAsync(source)`             |

Prefer asynchronous methods for application work. Synchronous database methods can block the JavaScript thread, especially for large queries or migrations.

## Bind values, not SQL syntax

`execAsync()` does not bind or escape values. Use it for trusted, static SQL. For data, use variadic arguments, arrays, or named parameters:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

async function addTodo(db: SQLiteDatabase, title: string) {
  const result = await db.runAsync('INSERT INTO todos (title) VALUES (?)', title);
  return result.lastInsertRowId;
}

async function setCompleted(db: SQLiteDatabase, id: number, completed: boolean) {
  await db.runAsync('UPDATE todos SET completed = $completed WHERE id = $id', {
    $completed: completed ? 1 : 0,
    $id: id,
  });
}
```

Bindings represent values, not table names, column names, or SQL fragments. Use fixed SQL or an allowlist for dynamic identifiers. Bind `null` for SQL NULL; serialize objects explicitly. `Uint8Array` and `ArrayBuffer` can be bound to BLOB columns in the current package.

The `db.sql` tag replaces interpolations with bound parameters. Do not put quotes around `${value}` or interpolate an array expecting an expanded `IN` list:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

type Todo = { id: number; title: string; completed: number };

async function findTodo(db: SQLiteDatabase, id: number) {
  const sql = db.sql;
  return await sql<Todo>`SELECT * FROM todos WHERE id = ${id}`.first();
}
```

Awaiting a tagged `SELECT` returns rows; `.first()` returns a row or `null`, `.each()` iterates rows, and `.values()` returns arrays of column values. Writes without `RETURNING` normally return `SQLiteRunResult`; prefer `runAsync()` when you need unambiguous write metadata. A generic type describes the expected row shape; it does not validate stored data or transform SQLite integers into JavaScript booleans.

## React integration and migrations

Mount one stable `SQLiteProvider` above the consumers of a database. Descendants call `useSQLiteContext()` to obtain it. Put initialization in `onInit`, which completes before the children render. Keep `onInit` and options stable so a render does not reopen the database.

This example migrates a new database through versions 1 and 2, and upgrades an existing version 1 database without deleting its rows:

```tsx
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName="app.db" onInit={initializeDatabase}>
      {children}
    </SQLiteProvider>
  );
}

async function initializeDatabase(db: SQLiteDatabase) {
  // Connection settings must be applied outside the migration transaction.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (version === null) {
    throw new Error('Could not read the database schema version');
  }
  if (version.user_version > 2) {
    throw new Error('Database schema is newer than this app supports');
  }
  if (version.user_version === 2) {
    return;
  }

  // onInit gates consumers; no other database work should run during initialization.
  await db.withTransactionAsync(async () => {
    if (version.user_version < 1) {
      await db.execAsync(`
        CREATE TABLE todos (id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL);
      `);
    }
    if (version.user_version < 2) {
      await db.execAsync('ALTER TABLE todos ADD COLUMN completed INTEGER NOT NULL DEFAULT 0');
    }
    await db.execAsync('PRAGMA user_version = 2');
  });
}
```

Keep schema changes and their `user_version` update in the same transaction so failure rolls both back. WAL generally improves database performance; enable foreign keys on each connection that relies on them. Do not delete an existing database to work around a migration error.

For Suspense, wrap a provider with `useSuspense` in `<Suspense fallback={...}>` and handle failures with an error boundary. `onError` cannot be combined with `useSuspense`. Outside React, share an `openDatabaseAsync()` initialization promise and close the database when its owner is done; do not close the provider's database from a child.

`useSQLiteContext()` exposes the database, not reactive query results. Refresh local state or invalidate the app's query cache after writes. For external changes, see the listener guidance in [references/web-and-config.md](references/web-and-config.md).

## Transactions and concurrent work

`withTransactionAsync()` commits on success and rolls back on a rejected callback. Queries started elsewhere on the same connection while it is active also join the transaction. Await every operation; do not launch unrelated work during initialization.

On native platforms, use `withExclusiveTransactionAsync()` when unrelated queries must stay outside a transaction. Run all transaction queries through `txn`, including queries in helper functions:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

async function completeTodo(db: SQLiteDatabase, id: number) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('UPDATE todos SET completed = ? WHERE id = ?', 1, id);
  });
}
```

This API is **not supported on web**. It opens a separate connection; competing writes can fail with `database is locked`, rather than being automatically queued. On web, serialize access through the app's database owner and use `withTransactionAsync()`; a platform switch alone does not provide equivalent isolation. Avoid nested transaction helpers.

## Prepared statements

Prepare once for repeated execution and always finalize, including on failure:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

async function insertTodos(db: SQLiteDatabase, titles: string[]) {
  const statement = await db.prepareAsync('INSERT INTO todos (title) VALUES ($title)');
  try {
    for (const title of titles) {
      await statement.executeAsync({ $title: title });
    }
  } finally {
    await statement.finalizeAsync();
  }
}
```

For an atomic batch, call this helper with the database or `txn` belonging to a surrounding transaction. `executeAsync<T>()` returns metadata and a cursor with `getFirstAsync()`, `getAllAsync()`, and async iteration. Call `resetAsync()` before reading the same result from the beginning again. Consuming a cursor and then calling `getAllAsync()` without resetting is not a fresh query.

## Key-value storage

For AsyncStorage-compatible string storage:

```ts
import Storage from 'expo-sqlite/kv-store';

await Storage.setItem('settings', JSON.stringify({ theme: 'dark' }));
const saved = await Storage.getItem('settings'); // string | null
```

Synchronous methods such as `getItemSync()` are also available. Changing an AsyncStorage import changes the backend; it **does not migrate existing data**. For an existing app, explicitly copy needed keys from the old store, verify the copy, and make the migration safe to retry before removing that dependency. Preserve the user's choice of backend when a migration was not requested.

For shared web-style code, `import 'expo-sqlite/localStorage/install'` installs SQLite-backed `globalThis.localStorage` on native platforms. It is a no-op on web, where browser storage remains in use. Plain SQLite and the key-value store are not encrypted secret storage.

## Debugging and verification

In development, press **Shift+M** in the Expo CLI terminal and select **Open expo-sqlite** to inspect tables and run queries. Treat edits there as writes to the app's actual database.

For storage changes, verify a fresh install, reopening with persisted data, upgrading an older schema, and rollback after a deliberately failed migration. Check empty query results and strings containing quotes. Test concurrent writes when changing transaction handling, and test web in its configured browser environment when web is a target.

Read [references/web-and-config.md](references/web-and-config.md) for web setup, native build options, SQLCipher, bundled databases, App Groups, change listeners, and database backups.
