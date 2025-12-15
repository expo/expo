import { NativeSession } from './NativeSession';
import { NativeStatement } from './NativeStatement';
/**
 * A class that represents an instance of the SQLite database.
 */
export declare class NativeDatabase {
    constructor(databasePath: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array);
    initAsync(): Promise<void>;
    isInTransactionAsync(): Promise<boolean>;
    closeAsync(): Promise<void>;
    execAsync(source: string): Promise<void>;
    serializeAsync(databaseName: string): Promise<Uint8Array>;
    prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;
    createSessionAsync(nativeSession: NativeSession, dbName: string): Promise<NativeSession>;
    loadExtensionAsync(libPath: string, entryPoint?: string): Promise<void>;
    initSync(): void;
    isInTransactionSync(): boolean;
    closeSync(): void;
    execSync(source: string): void;
    serializeSync(databaseName: string): Uint8Array;
    prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;
    createSessionSync(nativeSession: NativeSession, dbName: string): NativeSession;
    loadExtensionSync(libPath: string, entryPoint?: string): void;
    syncLibSQL(): Promise<void>;
}
/**
 * Options for opening a database.
 */
export interface SQLiteOpenOptions {
    /**
     * Whether to call the [`sqlite3_update_hook()`](https://www.sqlite.org/c3ref/update_hook.html) function and enable the `onDatabaseChange` events. You can later subscribe to the change events by [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener).
     * @default false
     */
    enableChangeListener?: boolean;
    /**
     * Whether to create new connection even if connection with the same database name exists in cache.
     * @default false
     */
    useNewConnection?: boolean;
    /**
     * Finalized unclosed statements automatically when the database is closed.
     * @default true
     * @hidden
     */
    finalizeUnusedStatementsBeforeClosing?: boolean;
    /**
     * Options for libSQL integration.
     */
    libSQLOptions?: {
        /** The URL of the libSQL server. */
        url: string;
        /** The auth token for the libSQL server. */
        authToken: string;
        /**
         * Whether to use remote-only without syncing to local database.
         * @default false
         */
        remoteOnly?: boolean;
    };
}
type FlattenedOpenOptions = Omit<SQLiteOpenOptions, 'libSQLOptions'> & {
    libSQLUrl?: string;
    libSQLAuthToken?: string;
    libSQLRemoteOnly?: boolean;
};
/**
 * Flattens the SQLiteOpenOptions that are passed to the native module.
 */
export declare function flattenOpenOptions(options: SQLiteOpenOptions): FlattenedOpenOptions;
export {};
//# sourceMappingURL=NativeDatabase.d.ts.map