export interface Window {
    openDatabase?: (name: string, version: string, displayName: string, estimatedSize: number, creationCallback?: DatabaseCallback) => Database;
}
export declare type DatabaseCallback = (database: Database) => void;
/**
 * `Database` objects are returned by calls to `SQLite.openDatabase()`. Such an object represents a
 * connection to a database on your device.
 */
export interface Database {
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
export declare type SQLTransactionCallback = (transaction: SQLTransaction) => void;
export declare type SQLTransactionErrorCallback = (error: SQLError) => void;
/**
 * A `SQLTransaction` object is passed in as a parameter to the `callback` parameter for the
 * `db.transaction()` method on a `Database` (see above). It allows enqueuing SQL statements to
 * perform in a database transaction.
 */
export interface SQLTransaction {
    /**
     * Enqueue a SQL statement to execute in the transaction. Authors are strongly recommended to make
     * use of the `?` placeholder feature of the method to avoid against SQL injection attacks, and to
     * never construct SQL statements on the fly.
     * @param sqlStatement A string containing a database query to execute expressed as SQL. The string
     * may contain `?` placeholders, with values to be substituted listed in the `arguments` parameter.
     * @param args An array of values (numbers, strings or nulls) to substitute for `?` placeholders in the
     * SQL statement.
     * @param callback Called when the query is successfully completed during the transaction. Takes
     * two parameters: the transaction itself, and a `ResultSet` object (see below) with the results
     * of the query.
     * @param errorCallback Called if an error occurred executing this particular query in the
     * transaction. Takes two parameters: the transaction itself, and the error object.
     */
    executeSql(sqlStatement: string, args?: (number | string | null)[], callback?: SQLStatementCallback, errorCallback?: SQLStatementErrorCallback): void;
}
export declare type SQLStatementCallback = (transaction: SQLTransaction, resultSet: SQLResultSet) => void;
export declare type SQLStatementErrorCallback = (transaction: SQLTransaction, error: SQLError) => boolean;
export declare type SQLResultSet = {
    /**
     * The row ID of the row that the SQL statement inserted into the database, if a row was inserted.
     */
    insertId?: number;
    /**
     * The number of rows that were changed by the SQL statement.
     */
    rowsAffected: number;
    rows: SQLResultSetRowList;
};
export interface SQLResultSetRowList {
    /**
     * The number of rows returned by the query.
     */
    length: number;
    /**
     * Returns the row with the given `index`. If there is no such row, returns `null`.
     * @param index Index of row to get.
     */
    item(index: number): any;
    /**
     * The actual array of rows returned by the query. Can be used directly instead of
     * getting rows through rows.item().
     */
    _array: any[];
}
export declare class SQLError {
    static UNKNOWN_ERR: number;
    static DATABASE_ERR: number;
    static VERSION_ERR: number;
    static TOO_LARGE_ERR: number;
    static QUOTA_ERR: number;
    static SYNTAX_ERR: number;
    static CONSTRAINT_ERR: number;
    static TIMEOUT_ERR: number;
    code: number;
    message: string;
}
export interface WebSQLDatabase extends Database {
    exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void;
    /**
     * Close the database.
     */
    closeAsync(): void;
    /**
     * Delete the database file.
     * > The database has to be closed prior to deletion.
     */
    deleteAsync(): Promise<void>;
}
export declare type Query = {
    sql: string;
    args: unknown[];
};
export declare type ResultSetError = {
    error: Error;
};
/**
 * `ResultSet` objects are returned through second parameter of the `success` callback for the
 * `tx.executeSql()` method on a `SQLTransaction` (see above).
 */
export declare type ResultSet = {
    /**
     * The row ID of the row that the SQL statement inserted into the database, if a row was inserted.
     */
    insertId?: number;
    /**
     * The number of rows that were changed by the SQL statement.
     */
    rowsAffected: number;
    rows: {
        [column: string]: any;
    }[];
};
export declare type SQLiteCallback = (error?: Error | null, resultSet?: (ResultSetError | ResultSet)[]) => void;
//# sourceMappingURL=SQLite.types.d.ts.map