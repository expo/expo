import ExpoSQLite from './ExpoSQLite';

/**
 * Options for [`configureWeb()`](#sqliteconfigureweboptions).
 * @platform web
 */
export interface SQLiteWebOptions {
  /**
   * The URL of a custom wa-sqlite WebAssembly build, for example one built with FTS enabled.
   * When omitted, `expo-sqlite` uses its bundled build.
   *
   * The build must come from the [`expo/wa-sqlite`](https://github.com/expo/wa-sqlite) revision that matches your `expo-sqlite` version.
   * A build from another revision may fail to load.
   */
  wasmURL?: string;
}

/**
 * Configures how `expo-sqlite` runs on web.
 * Each call replaces the options from the previous call.
 * It has no effect on Android, iOS, and server rendering.
 *
 * Call it before opening any database.
 * It throws after a database is opened, because the web worker loads SQLite only once.
 *
 * @example
 * ```ts
 * SQLite.configureWeb({ wasmURL: require('./assets/wa-sqlite-fts.wasm') });
 * const db = await SQLite.openDatabaseAsync('app.db');
 * ```
 *
 * @platform web
 */
export function configureWeb(options: SQLiteWebOptions): void {
  // Only the browser web module implements it.
  ExpoSQLite.configureWeb?.(options);
}
