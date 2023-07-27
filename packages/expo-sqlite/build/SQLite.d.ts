import './polyfillNextTick';
import type { Query, ResultSet, ResultSetError, SQLiteCallback, SQLTransactionAsyncCallback, SQLTransactionAsync, SQLTransactionCallback, SQLTransactionErrorCallback } from './SQLite.types';
/** The database returned by `openDatabase()` */
export declare class SQLiteDatabase {
    _name: string;
    _closed: boolean;
    constructor(name: string);
    /**
     * Executes the SQL statement and returns a callback resolving with the result.
     */
    exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void;
    /**
     * Executes the SQL statement and returns a Promise resolving with the result.
     */
    execAsync(queries: Query[], readOnly: boolean): Promise<(ResultSetError | ResultSet)[]>;
    /**
     * @deprecated Use `closeAsync()` instead.
     */
    close: () => void;
    /**
     * Close the database.
     */
    closeAsync(): void;
    /**
     * Delete the database file.
     * > The database has to be closed prior to deletion.
     */
    deleteAsync(): Promise<void>;
    /**
     * Creates a new transaction with Promise support.
     * @param asyncCallback A `SQLTransactionAsyncCallback` function that can perform SQL statements in a transaction.
     * @param readOnly true if all the SQL statements in the callback are read only.
     */
    transactionAsync(asyncCallback: SQLTransactionAsyncCallback, readOnly?: boolean): Promise<void>;
    version: string;
    /**
     * Execute a database transaction.
     * @param callback A function representing the transaction to perform. Takes a Transaction
     * (see below) as its only parameter, on which it can add SQL statements to execute.
     * @param errorCallback Called if an error occurred processing this transaction. Takes a single
     * parameter describing the error.
     * @param successCallback Called when the transaction has completed executing on the database.
     */
    transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: () => void): void;
    readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: () => void): void;
}
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
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (db: SQLiteDatabase) => void): SQLiteDatabase;
/**
 * Internal data structure for the async transaction API.
 * @internal
 */
export declare class ExpoSQLTransactionAsync implements SQLTransactionAsync {
    private readonly db;
    private readonly readOnly;
    constructor(db: SQLiteDatabase, readOnly: boolean);
    executeSqlAsync(sqlStatement: string, args?: (number | string)[]): Promise<ResultSetError | ResultSet>;
}
//# sourceMappingURL=SQLite.d.ts.map