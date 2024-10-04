import { NativeStatement } from './NativeStatement';
/**
 * A class that represents an instance of the SQLite database.
 */
export declare class NativeDatabase {
    constructor(dbName: string, options?: OpenOptions);
    initAsync(): Promise<void>;
    isInTransactionAsync(): Promise<boolean>;
    closeAsync(): Promise<void>;
    execAsync(source: string): Promise<void>;
    prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;
    initSync(): void;
    isInTransactionSync(): boolean;
    closeSync(): void;
    execSync(source: string): void;
    prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;
}
/**
 * Options for opening a database.
 */
export interface OpenOptions {
    /**
     * Whether to enable the CR-SQLite extension.
     * @default false
     */
    enableCRSQLite?: boolean;
    /**
     * Whether to call the `sqlite3_update_hook` function and enable the `onDatabaseChange` events.
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
}
//# sourceMappingURL=NativeDatabase.d.ts.map