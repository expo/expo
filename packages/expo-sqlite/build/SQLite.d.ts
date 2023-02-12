import './polyfillNextTick';
import { WebSQLDatabase } from './SQLite.types';
/**
 * Open a database, creating it if it doesn't exist, and return a `Database` object. On disk,
 * the database will be created under the app's [documents directory](./filesystem), i.e.
 * `${FileSystem.documentDirectory}/SQLite/${name}`.
 * > The `version`, `description` and `size` arguments are ignored, but are accepted by the function
 * for compatibility with the WebSQL specification.
 * @param name Name of the database file to open.
 * @param version
 * @param description
 * @param size
 * @param callback
 * @return
 */
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (db: WebSQLDatabase) => void): WebSQLDatabase;
//# sourceMappingURL=SQLite.d.ts.map