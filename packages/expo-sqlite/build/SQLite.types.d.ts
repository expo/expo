export interface DatabaseCallback {
    (database: Database): void;
}
/** 4.3 Asynchronous database API - The transaction() and readTransaction() methods takes
 * one to three arguments. When called, these methods must immediately return and then
 * asynchronously run the transaction steps with the transaction callback being the
 * first argument, the error callback being the second argument, if any, the success
 * callback being the third argument, if any, and with no preflight operation or
 * postflight operation
 */
export interface Database {
    version: string;
    transaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;
    readTransaction(callback: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;
    /** The changeVersion() method allows scripts to atomically verify the version number and change
     * it at the same time as doing a schema update. When the method is invoked, it must immediately
     * return, and then asynchronously run the transaction steps with the transaction callback being
     * the third argument, the error callback being the fourth argument, the success callback being
     * the fifth argument
     */
    changeVersion(oldVersion: string, newVersion: string, callback?: SQLTransactionCallback, errorCallback?: SQLTransactionErrorCallback, successCallback?: SQLVoidCallback): void;
}
export interface SQLVoidCallback {
    (): void;
}
export interface SQLTransactionCallback {
    (transaction: SQLTransaction): void;
}
export interface SQLTransactionErrorCallback {
    (error: SQLError): void;
}
/** 4.3.1 Executing SQL statements
 */
export interface SQLTransaction {
    executeSql(sqlStatement: string, args?: Array<any>, callback?: SQLStatementCallback, errorCallback?: SQLStatementErrorCallback): void;
}
export interface SQLStatementCallback {
    (transaction: SQLTransaction, resultSet: SQLResultSet): void;
}
export interface SQLStatementErrorCallback {
    (transaction: SQLTransaction, error: SQLError): boolean;
}
/** 4.4 Synchronous database API
 */
export interface DatabaseSync {
    version: string;
    transaction(callback: SQLTransactionSyncCallback): void;
    readTransaction(callback: SQLTransactionSyncCallback): void;
    changeVersion(oldVersion: string, newVersion: string, callback: SQLTransactionSyncCallback): void;
}
export interface SQLTransactionSyncCallback {
    (transaction: SQLTransactionSync): void;
}
/** 4.4.1 Executing SQL statements
 */
export interface SQLTransactionSync {
    executeSql(sqlStatement: string, args?: Array<any>): SQLResultSet;
}
/** 4.5 Database query results
 * The insertId attribute must return the row ID of the row that the SQLResultSet
 * object's SQL statement inserted into the database, if the statement inserted a row.
 * If the statement inserted multiple rows, the ID of the last row must be the one returned.
 * If the statement did not insert a row, then the attribute must instead raise an INVALID_ACCESS_ERR exception.
 *
 * The rowsAffected attribute must return the number of rows that were changed by the SQL statement.
 * If the statement did not affected any rows, then the attribute must return zero.
 * For "SELECT" statements, this returns zero (querying the database doesn't affect any rows).
 *
 * The rows attribute must return a SQLResultSetRowList representing the rows returned,
 * in the order returned by the database. The same object must be returned each time.
 * If no rows were returned, then the object will be empty (its length will be zero)
 */
export interface SQLResultSet {
    insertId: number;
    rowsAffected: number;
    rows: SQLResultSetRowList;
}
/** SQLResultSetRowList objects have a length attribute that must return the number of
 * rows it represents (the number of rows returned by the database). This is the length.
 * Fetching the length might be expensive, and authors are thus encouraged to avoid using
 * it (or enumerating over the object, which implicitly uses it) where possible.
 * The object's supported property indices are the numbers in the range zero to length-1,
 * unless the length is zero, in which case there are no supported property indices.
 * The item(index) attribute must return the row with the given index index.
 * If there is no such row, then the method must return null.
 *
 * Each row must be represented by a native ordered dictionary data type. In the
 * JavaScript binding, this must be Object. Each row object must have one property
 * (or dictionary entry) per column, with those properties enumerating in the order
 * that these columns were returned by the database. Each property must have the
 * name of the column and the value of the cell, as they were returned by the database
 */
export interface SQLResultSetRowList {
    length: number;
    item(index: number): any;
}
/** 4.6 Errors and exceptions - asynchronous database API error
 */
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
export declare class SQLException {
    /** Code 0 - The transaction failed for reasons unrelated to the database itself
     * and not covered by any other error code.
     */
    static UNKNOWN_ERR: number;
    /** Code 1 - The statement failed for database reasons not covered by any other error code. */
    static DATABASE_ERR: number;
    /** Code 2 - The operation failed because the actual database version was not what it should be.
     * For example, a statement found that the actual database version no longer matched the
     * expected version of the Database or DatabaseSync object, or the Database.changeVersion()
     * or DatabaseSync.changeVersion() methods were passed a version that doesn't match the actual database version.
     */
    static VERSION_ERR: number;
    /** Code 3 - The statement failed because the data returned from the database was too large.
     * The SQL "LIMIT" modifier might be useful to reduce the size of the result set.
     */
    static TOO_LARGE_ERR: number;
    /** Code 4 - The statement failed because there was not enough remaining storage space,
     * or the storage quota was reached and the user declined to give more space to the database.
     */
    static QUOTA_ERR: number;
    /** Code 5 - The statement failed because of a syntax error, or the number of arguments did
     * not match the number of ? placeholders in the statement, or the statement tried to use a
     * statement that is not allowed, such as BEGIN, COMMIT, or ROLLBACK, or the statement tried
     * to use a verb that could modify the database but the transaction was read-only. */
    static SYNTAX_ERR: number;
    /** Code 6 - An INSERT, UPDATE, or REPLACE statement failed due to a constraint failure.
     * For example, because a row was being inserted and the value given for the primary
     * key column duplicated the value of an existing row. */
    static CONSTRAINT_ERR: number;
    /** Code 7 - A lock for the transaction could not be obtained in a reasonable time. */
    static TIMEOUT_ERR: number;
    code: number;
    message: string;
}
