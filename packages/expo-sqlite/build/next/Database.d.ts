import { Subscription } from 'expo-modules-core';
import { NativeDatabase, OpenOptions } from './NativeDatabase';
import { BindParams, RunResult, Statement, VariadicBindParams } from './Statement';
export { OpenOptions };
/**
 * A SQLite database.
 */
export declare class Database {
    readonly dbName: string;
    private readonly nativeDatabase;
    constructor(dbName: string, nativeDatabase: NativeDatabase);
    /**
     * Asynchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionAsync(): Promise<boolean>;
    /**
     * Close the database.
     */
    closeAsync(): Promise<void>;
    /**
     * Execute all SQL queries in the supplied string.
     * > Note: The queries are not escaped for you! Be careful when constructing your queries.
     *
     * @param source A string containing all the SQL queries.
     */
    execAsync(source: string): Promise<void>;
    /**
     * Prepare a SQL statement.
     *
     * @param source A string containing the SQL query.
     * @returns A `Statement` object.
     */
    prepareAsync(source: string): Promise<Statement>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** This transaction is not exclusive and can be interrupted by other async queries.
     * @example
     * ```ts
     * db.transactionAsync(async () => {
     *   await db.execAsync('UPDATE test SET name = "aaa"');
     *
     *   //
     *   // We cannot control the order of async/await order, so order of execution is not guaranteed.
     *   // The following UPDATE query out of transaction may be executed here and break the expectation.
     *   //
     *
     *   const result = await db.getAsync<{ name: string }>('SELECT name FROM Users');
     *   expect(result?.name).toBe('aaa');
     * });
     * db.execAsync('UPDATE test SET name = "bbb"');
     * ```
     * If you worry about the order of execution, use `transactionExclusiveAsync` instead.
     *
     * @param task An async function to execute within a transaction.
     */
    transactionAsync(task: () => Promise<void>): Promise<void>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * The transaction may be exclusive.
     * As long as the transaction is converted into a write transaction,
     * the other async write queries will abort with `database is locked` error.
     *
     * @param task An async function to execute within a transaction. Any queries inside the transaction must be executed on the `txn` object.
     * The `txn` object has the same interfaces as the `Database` object. You can use `txn` like a `Database` object.
     *
     * @example
     * ```ts
     * db.transactionExclusiveAsync(async (txn) => {
     *   await txn.execAsync('UPDATE test SET name = "aaa"');
     * });
     * ```
     */
    transactionExclusiveAsync(task: (txn: Transaction) => Promise<void>): Promise<void>;
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionSync(): boolean;
    /**
     * Close the database.
     */
    closeSync(): void;
    /**
     * Execute all SQL queries in the supplied string.
     *
     * > **Note:** The queries are not escaped for you! Be careful when constructing your queries.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing all the SQL queries.
     */
    execSync(source: string): void;
    /**
     * Prepare a SQL statement.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @returns A `Statement` object.
     */
    prepareSync(source: string): Statement;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param task An async function to execute within a transaction.
     */
    transactionSync(task: () => void): void;
    /**
     * Shorthand for `prepareAsync` and `Statement.runAsync`.
     * Unlike `Statement.runAsync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    runAsync(source: string, ...params: VariadicBindParams): Promise<RunResult>;
    runAsync(source: string, params: BindParams): Promise<RunResult>;
    /**
     * Shorthand for `prepareAsync` and `Statement.getAsync`.
     * Unlike `Statement.getAsync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    getAsync<T>(source: string, ...params: VariadicBindParams): Promise<T | null>;
    getAsync<T>(source: string, params: BindParams): Promise<T | null>;
    /**
     * Shorthand for `prepareAsync` and `Statement.eachAsync`.
     * Unlike `Statement.eachAsync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    eachAsync<T>(source: string, ...params: VariadicBindParams): AsyncIterableIterator<T>;
    eachAsync<T>(source: string, params: BindParams): AsyncIterableIterator<T>;
    /**
     * Shorthand for `prepareAsync` and `Statement.allAsync`.
     * Unlike `Statement.allAsync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    allAsync<T>(source: string, ...params: VariadicBindParams): Promise<T[]>;
    allAsync<T>(source: string, params: BindParams): Promise<T[]>;
    /**
     * Shorthand for `prepareSync` and `Statement.runSync`.
     * Unlike `Statement.runSync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    runSync(source: string, ...params: VariadicBindParams): RunResult;
    runSync(source: string, params: BindParams): RunResult;
    /**
     * Shorthand for `prepareSync` and `Statement.getSync`.
     * Unlike `Statement.getSync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    getSync<T>(source: string, ...params: VariadicBindParams): T | null;
    getSync<T>(source: string, params: BindParams): T | null;
    /**
     * Shorthand for `prepareSync` and `Statement.eachSync`.
     * Unlike `Statement.eachSync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    eachSync<T>(source: string, ...params: VariadicBindParams): IterableIterator<T>;
    eachSync<T>(source: string, params: BindParams): IterableIterator<T>;
    /**
     * Shorthand for `prepareSync` and `Statement.allSync`.
     * Unlike `Statement.allSync`, this method finalizes the statement after execution.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    allSync<T>(source: string, ...params: VariadicBindParams): T[];
    allSync<T>(source: string, params: BindParams): T[];
}
/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 * @returns Database object.
 */
export declare function openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database>;
/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 * @returns Database object.
 */
export declare function openDatabaseSync(dbName: string, options?: OpenOptions): Database;
/**
 * Delete a database file.
 *
 * @param dbName The name of the database file to delete.
 */
export declare function deleteDatabaseAsync(dbName: string): Promise<void>;
/**
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
 *
 * @param dbName The name of the database file to delete.
 */
export declare function deleteDatabaseSync(dbName: string): void;
/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
 *
 * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export declare function addDatabaseChangeListener(listener: (event: {
    /** The database name. The value would be `main` by default and other database names if you use `ATTACH DATABASE` statement. */
    dbName: string;
    /** The absolute file path to the database. */
    dbFilePath: string;
    /** The table name. */
    tableName: string;
    /** The changed row ID. */
    rowId: number;
}) => void): Subscription;
/**
 * A new connection specific for `transactionExclusiveAsync`.
 */
declare class Transaction extends Database {
    static createAsync(db: Database): Promise<Transaction>;
}
//# sourceMappingURL=Database.d.ts.map