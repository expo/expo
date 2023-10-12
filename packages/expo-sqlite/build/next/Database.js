import { EventEmitter } from 'expo-modules-core';
import ExpoSQLite from './ExpoSQLiteNext';
import { Statement } from './Statement';
const emitter = new EventEmitter(ExpoSQLite);
/**
 * A SQLite database.
 */
export class Database {
    nativeDatabase;
    constructor(nativeDatabase) {
        this.nativeDatabase = nativeDatabase;
    }
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransaction() {
        return this.nativeDatabase.isInTransaction();
    }
    /**
     * Asynchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionAsync() {
        return this.nativeDatabase.isInTransactionAsync();
    }
    /**
     * Close the database.
     */
    closeAsync() {
        return this.nativeDatabase.closeAsync();
    }
    /**
     * Execute all SQL queries in the supplied string.
     * > Note: The queries are not escaped for you! Be careful when constructing your queries.
     *
     * @param source A string containing all the SQL queries.
     */
    execAsync(source) {
        return this.nativeDatabase.execAsync(source);
    }
    /**
     * Prepare a SQL statement.
     *
     * @param source A string containing the SQL query.
     * @returns A `Statement` object.
     */
    async prepareAsync(source) {
        const nativeStatement = new ExpoSQLite.NativeStatement();
        await this.nativeDatabase.prepareAsync(nativeStatement, source);
        return new Statement(this.nativeDatabase, nativeStatement);
    }
    /**
     * Execute a transaction and automatically commit/rollback based on the `txn` success.
     *
     * @param txn An async function to execute within a transaction.
     */
    async transactionAsync(txn) {
        try {
            await this.nativeDatabase.execAsync('BEGIN');
            await txn();
            await this.nativeDatabase.execAsync('COMMIT');
        }
        catch (e) {
            await this.nativeDatabase.execAsync('ROLLBACK');
            throw e;
        }
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
/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 * @returns Database object.
 */
export async function openDatabaseAsync(dbName, options) {
    const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
    await nativeDatabase.initAsync();
    return new Database(nativeDatabase);
}
/**
 * Delete a database file.
 *
 * @param dbName The name of the database file to delete.
 */
export async function deleteDatabaseAsync(dbName) {
    return await ExpoSQLite.deleteDatabaseAsync(dbName);
}
/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
 *
 * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export function addDatabaseChangeListener(listener) {
    return emitter.addListener('onDatabaseChange', listener);
}
//# sourceMappingURL=Database.js.map