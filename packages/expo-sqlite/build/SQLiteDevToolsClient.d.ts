import type { SQLiteDatabase } from './SQLiteDatabase';
export declare function registerDatabaseForDevToolsAsync(database: SQLiteDatabase): Promise<void>;
export declare function unregisterDatabaseForDevToolsAsync(database: SQLiteDatabase): Promise<void>;
/**
 * Close the devtools client.
 * Exposed for testing purposes.
 */
export declare function closeDevToolsClientAsync(): Promise<void>;
//# sourceMappingURL=SQLiteDevToolsClient.d.ts.map