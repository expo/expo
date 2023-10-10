import { EventEmitter } from 'expo-modules-core';
import ExpoSQLite from './ExpoSQLiteNext';
import { Statement } from './Statement';
const emitter = new EventEmitter(ExpoSQLite);
/**
 * A SQLite database.
 */
export class Database {
    dbName;
    options;
    databaseId = -1;
    constructor(dbName, options) {
        this.dbName = dbName;
        this.options = options;
    }
    async openAsync() {
        return await ExpoSQLite.openDatabaseAsync(this.dbName, this.options ?? {});
    }
    /**
     * Open a database.
     *
     * @param dbName The name of the database file to open.
     * @param options Open options.
     * @returns Database object.
     */
    static async openDatabaseAsync(dbName, options) {
        const db = new Database(dbName, options);
        db.databaseId = await db.openAsync();
        return db;
    }
    /**
     * Delete a database file.
     *
     * @param dbName The name of the database file to delete.
     */
    static async deleteDatabaseAsync(dbName) {
        return await ExpoSQLite.deleteDatabaseAsync(dbName);
    }
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransaction() {
        return ExpoSQLite.isInTransaction(this.databaseId);
    }
    /**
     * Asynchronous call to return whether the database is currently in a transaction.
     */
    async isInTransactionAsync() {
        return await ExpoSQLite.isInTransactionAsync(this.databaseId);
    }
    /**
     * Close the database.
     */
    async closeAsync() {
        await ExpoSQLite.closeDatabaseAsync(this.databaseId);
    }
    /**
     * Execute all SQL queries in the supplied string.
     * > Note: The queries are not escaped for you! Be careful when constructing your queries.
     *
     * @param source A string containing all the SQL queries.
     */
    async execAsync(source) {
        await ExpoSQLite.execAsync(this.databaseId, source);
    }
    /**
     * Prepare a SQL statement.
     *
     * @param source A string containing the SQL query.
     * @returns A `Statement` object.
     */
    async prepareAsync(source) {
        const statementId = await ExpoSQLite.prepareAsync(this.databaseId, source);
        return new Statement(this.databaseId, statementId);
    }
    /**
     * Execute a transaction and automatically commit/rollback based on the `txn` success.
     *
     * @param txn An async function to execute within a transaction.
     */
    async transactionAsync(txn) {
        try {
            await this.execAsync('BEGIN');
            await txn();
            await this.execAsync('COMMIT');
        }
        catch (e) {
            await this.execAsync('ROLLBACK');
            throw e;
        }
    }
    /**
     * Add a listener for database changes.
     * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
     *
     * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
     * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addDatabaseChangeListener(listener) {
        return emitter.addListener('onDatabaseChange', listener);
    }
    async runAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        const result = await statement.runAsync(...params);
        await statement.finalizeAsync();
        return result;
    }
    async getAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        const result = await statement.getAsync(...params);
        await statement.finalizeAsync();
        return result;
    }
    async *eachAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        yield* statement.eachAsync(...params);
        await statement.finalizeAsync();
    }
    async allAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        const result = await statement.allAsync(...params);
        await statement.finalizeAsync();
        return result;
    }
}
export const openDatabaseAsync = Database.openDatabaseAsync;
export const deleteDatabaseAsync = Database.deleteDatabaseAsync;
//# sourceMappingURL=Database.js.map