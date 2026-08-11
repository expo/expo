# expo-sqlite: web setup, config plugin, and advanced APIs

## Web (wasm) setup

expo-sqlite on web needs Metro to bundle **wasm** files and the page to allow `SharedArrayBuffer`. Add to **metro.config.js** (create it with `npx expo customize metro.config.js` if missing):

```js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm asset support
config.resolver.assetExts.push('wasm');

// Add COEP and COOP headers to support SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
```

Production web hosting must also send the `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` headers. On EAS Hosting, set them through the `expo-router` plugin:

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

## Config plugin

Build-time options (require a new native build; not available at runtime):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-sqlite",
        {
          "enableFTS": true,
          "useSQLCipher": true,
          "android": { "enableFTS": false, "useSQLCipher": false },
          "ios": { "customBuildFlags": "-DSQLITE_ENABLE_DBSTAT_VTAB=1" }
        }
      ]
    ]
  }
}
```

| Property | Default | Description |
| --- | --- | --- |
| `customBuildFlags` | — | Extra flags for the SQLite build. |
| `enableFTS` | `true` | Enable the FTS3, FTS4, and FTS5 full-text-search extensions. |
| `useSQLCipher` | `false` | Build with SQLCipher instead of plain SQLite. |
| `withSQLiteVecExtension` | `false` | Bundle the `sqlite-vec` extension (exposed through `bundledExtensions`). |

`android` / `ios` keys override the shared values per platform.

## SQLCipher

Not supported in Expo Go — requires a development build with `useSQLCipher: true`, then `npx expo prebuild`. Set the key right after opening:

```ts
const db = await SQLite.openDatabaseAsync('databaseName');
await db.execAsync(`PRAGMA key = 'password'`);
```

## Sharing a database with app extensions (iOS App Groups)

1. Add the App Group entitlement in app config (`ios.entitlements["com.apple.security.application-groups"]`).
2. Pass the shared container path as `directory`:

```tsx
import { SQLiteProvider, defaultDatabaseDirectory } from 'expo-sqlite';
import { Paths } from 'expo-file-system';

const dbDirectory =
  Platform.OS === 'ios'
    ? Object.values(Paths.appleSharedContainers)?.[0]?.uri
    : defaultDatabaseDirectory;

<SQLiteProvider databaseName="test.db" directory={dbDirectory}>...</SQLiteProvider>;
```

## Change listeners

Open the database with `enableChangeListener: true`, then subscribe:

```ts
import { addDatabaseChangeListener } from 'expo-sqlite';

const subscription = addDatabaseChangeListener(({ databaseName, tableName, rowId }) => {
  // react to row changes
});
// later: subscription.remove();
```

## Backup, serialization, and maintenance

- `backupDatabaseAsync({ sourceDatabase, destDatabase })` — online backup between two open databases.
- `db.serializeAsync()` → `Uint8Array`; `deserializeDatabaseAsync(bytes)` opens a database from bytes.
- `deleteDatabaseAsync(name, directory?)` — delete a database file.
- `openDatabaseAsync(name, options?, directory?)` options include `enableChangeListener` and `useNewConnection`.

## Platform notes

- On Apple TV, database files live in the caches directory (per Apple platform guidelines), not the documents directory.
- The DevTools inspector (Shift+M in Expo CLI → **Open expo-sqlite**) works with any configuration in development.
- Drizzle ORM and Knex.js integrate on top of expo-sqlite; Drizzle Studio has its own dev tools plugin (`drizzle-studio-expo`).
