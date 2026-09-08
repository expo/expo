# Web setup and native configuration

## Web and Metro

Metro must bundle `.wasm` files, and the browser needs `SharedArrayBuffer`. Merge the following into the existing Metro configuration, preserving other customizations and middleware:

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
```

Development middleware does not configure production hosting. Serve the same `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` headers from the deployed web server. On EAS Hosting, merge these headers into the existing `expo-router` plugin entry:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-router",
        {
          "headers": {
            "Cross-Origin-Embedder-Policy": "credentialless",
            "Cross-Origin-Opener-Policy": "same-origin"
          }
        }
      ]
    ]
  }
}
```

Verify in a secure context (HTTPS or localhost) that `crossOriginIsolated` is true, `SharedArrayBuffer` is available, and the WASM asset loads. Test third-party resources affected by these headers. `withExclusiveTransactionAsync()` and the custom database `directory` parameter are not supported on web.

## Native build options

Configure the `expo-sqlite` plugin only when custom build options are needed. These settings require a new native binary; they do not change Expo Go or an existing binary through an OTA update.

| Property                 | Default | Purpose                                      |
| ------------------------ | ------- | -------------------------------------------- |
| `enableFTS`              | `true`  | Enable FTS3, FTS4, and FTS5 full-text search |
| `useSQLCipher`           | `false` | Build with SQLCipher encryption support      |
| `withSQLiteVecExtension` | `false` | Bundle the sqlite-vec extension              |
| `customBuildFlags`       | Unset   | Pass additional SQLite compile flags         |

The `android` and `ios` objects override shared values per platform. For example, to bundle sqlite-vec:

```json
{
  "expo": {
    "plugins": [["expo-sqlite", { "withSQLiteVecExtension": true }]]
  }
}
```

After rebuilding, load the bundled extension on a native connection before using it:

```ts
import * as SQLite from 'expo-sqlite';

async function loadVectorExtension(db: SQLite.SQLiteDatabase) {
  const extension = SQLite.bundledExtensions['sqlite-vec'];
  if (!extension) {
    throw new Error('Rebuild the app with withSQLiteVecExtension enabled');
  }
  await db.loadExtensionAsync(extension.libPath, extension.entryPoint);
}
```

Use the project's existing prebuild or native configuration workflow. Do not regenerate committed native projects just to install the standard package. The current package has removed libSQL support: `syncLibSQL()` and `libSQLOptions` are gone, and `useLibSQL` is deprecated and has no effect. Check the installed version when maintaining an older app.

## SQLCipher

SQLCipher is supported on Android, iOS, and macOS, and requires `useSQLCipher: true` and a custom native build. It is unavailable in Expo Go and on web.

Set `PRAGMA key` immediately after opening an encrypted database, before schema reads or migrations. Obtain the key from the app's secure key-management flow; do not hardcode or log it. PRAGMA assignments do not accept ordinary bound parameters, so use SQLCipher's documented key format and validate or escape it explicitly instead of interpolating arbitrary input into `execAsync()`.

Enabling SQLCipher does not encrypt an existing plaintext database. Plan an explicit data migration for that case. Also account for APIs that open new connections: `withExclusiveTransactionAsync()` creates a separate connection and does not apply a key configured with SQL on the original connection. Do not assume it works with an encrypted database without arranging and testing connection initialization.

## Bundled databases and App Groups

To seed a database, pass `assetSource={{ assetId: require('./assets/app.db') }}` to `SQLiteProvider`. Add `db` to Metro's `resolver.assetExts` if absent. By default the asset is imported only when the destination database does not exist. `forceOverwrite: true` replaces an existing database, so do not use it as a migration mechanism for user data.

For an iOS App Group, configure `ios.entitlements['com.apple.security.application-groups']` with the intended group, and pass that group's shared container to the provider:

```ts
import { Paths } from 'expo-file-system';

const directory = Paths.appleSharedContainers['group.com.example.app']?.uri;
if (!directory) {
  throw new Error('App Group container is unavailable; check the entitlement and native build');
}
```

Use this lookup on iOS and pass `directory` to `SQLiteProvider` or the third argument of `openDatabaseAsync()`. Select the specific group rather than the first container returned. Verify that both the app and extension use the same group and database name. On tvOS the default database location is the caches directory, so do not assume its contents are permanent.

## Change listeners

Open with `enableChangeListener: true` (or provider `options={{ enableChangeListener: true }}`) before subscribing with `addDatabaseChangeListener()`. The event includes `databaseName`, `databaseFilePath`, `tableName`, and `rowId`. Filter for the relevant database and table and remove the subscription on cleanup.

These are SQLite update-hook events, not reactive query results or transaction-commit notifications. Re-query or invalidate cached data as appropriate, account for rollbacks, and refresh after successful writes. Do not assume listeners on one connection observe changes from every other connection or process.

## Backups and serialization

- `backupDatabaseAsync({ sourceDatabase, destDatabase })` copies between open databases. Use a separate destination when preserving existing data.
- `db.serializeAsync()` returns `Uint8Array`; `deserializeDatabaseAsync(bytes)` opens a separate in-memory database, not a persistent file. Back it up to a file-backed database if persistence is needed.
- Close owned connections and finish active statements before deleting a database with `deleteDatabaseAsync(name, directory?)`.
- Avoid copying only the `.db` file from a live WAL database; committed data may still be in its WAL. Prefer the backup API for a consistent database copy.

For exact signatures and platform support, consult the installed `expo-sqlite` types and the [SQLite documentation for the app's SDK](https://docs.expo.dev/versions/latest/sdk/sqlite/).
