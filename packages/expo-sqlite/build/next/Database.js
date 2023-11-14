import { EventEmitter } from 'expo-modules-core';
import ExpoSQLite from './ExpoSQLiteNext';
import { Statement } from './Statement';
const emitter = new EventEmitter(ExpoSQLite);
/**
 * A SQLite database.
 */
export class Database {
    dbName;
    nativeDatabase;
    constructor(dbName, nativeDatabase) {
        this.dbName = dbName;
        this.nativeDatabase = nativeDatabase;
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
     */
    async prepareAsync(source) {
        const nativeStatement = new ExpoSQLite.NativeStatement();
        await this.nativeDatabase.prepareAsync(nativeStatement, source);
        return new Statement(this.nativeDatabase, nativeStatement);
    }
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
    async transactionAsync(task) {
        try {
            await this.execAsync('BEGIN');
            await task();
            await this.execAsync('COMMIT');
        }
        catch (e) {
            await this.execAsync('ROLLBACK');
            throw e;
        }
    }
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
    async transactionExclusiveAsync(task) {
        const transaction = await Transaction.createAsync(this);
        let error;
        try {
            await transaction.execAsync('BEGIN');
            await task(transaction);
            await transaction.execAsync('COMMIT');
        }
        catch (e) {
            await transaction.execAsync('ROLLBACK');
            error = e;
        }
        finally {
            await transaction.closeAsync();
        }
        if (error) {
            throw error;
        }
    }
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionSync() {
        return this.nativeDatabase.isInTransactionSync();
    }
    /**
     * Close the database.
     */
    closeSync() {
        return this.nativeDatabase.closeSync();
    }
    /**
     * Execute all SQL queries in the supplied string.
     *
     * > **Note:** The queries are not escaped for you! Be careful when constructing your queries.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param source A string containing all the SQL queries.
     */
    execSync(source) {
        return this.nativeDatabase.execSync(source);
    }
    /**
     * Prepare a SQL statement.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param source A string containing the SQL query.
     */
    prepareSync(source) {
        const nativeStatement = new ExpoSQLite.NativeStatement();
        this.nativeDatabase.prepareSync(nativeStatement, source);
        return new Statement(this.nativeDatabase, nativeStatement);
    }
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param task An async function to execute within a transaction.
     */
    transactionSync(task) {
        try {
            this.execSync('BEGIN');
            task();
            this.execSync('COMMIT');
        }
        catch (e) {
            this.execSync('ROLLBACK');
            throw e;
        }
    }
    async runAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        let result;
        try {
            result = await statement.runAsync(...params);
        }
        finally {
            await statement.finalizeAsync();
        }
        return result;
    }
    async getAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        let result;
        try {
            result = await statement.getAsync(...params);
        }
        finally {
            await statement.finalizeAsync();
        }
        return result;
    }
    async *eachAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        try {
            yield* await statement.eachAsync(...params);
        }
        finally {
            await statement.finalizeAsync();
        }
    }
    async allAsync(source, ...params) {
        const statement = await this.prepareAsync(source);
        let result;
        try {
            result = await statement.allAsync(...params);
        }
        finally {
            await statement.finalizeAsync();
        }
        return result;
    }
    runSync(source, ...params) {
        const statement = this.prepareSync(source);
        let result;
        try {
            result = statement.runSync(...params);
        }
        finally {
            statement.finalizeSync();
        }
        return result;
    }
    getSync(source, ...params) {
        const statement = this.prepareSync(source);
        let result;
        try {
            result = statement.getSync(...params);
        }
        finally {
            statement.finalizeSync();
        }
        return result;
    }
    *eachSync(source, ...params) {
        const statement = this.prepareSync(source);
        try {
            yield* statement.eachSync(...params);
        }
        finally {
            statement.finalizeSync();
        }
    }
    allSync(source, ...params) {
        const statement = this.prepareSync(source);
        let result;
        try {
            result = statement.allSync(...params);
        }
        finally {
            statement.finalizeSync();
        }
        return result;
    }
}
/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export async function openDatabaseAsync(dbName, options) {
    const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
    await nativeDatabase.initAsync();
    return new Database(dbName, nativeDatabase);
}
/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export function openDatabaseSync(dbName, options) {
    const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
    nativeDatabase.initSync();
    return new Database(dbName, nativeDatabase);
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
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to delete.
 */
export function deleteDatabaseSync(dbName) {
    return ExpoSQLite.deleteDatabaseSync(dbName);
}
/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set [`enableChangeListener` to `true`](#openoptions) when opening the database.
 *
 * @param listener A function that receives the `dbFilePath`, `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export function addDatabaseChangeListener(listener) {
    return emitter.addListener('onDatabaseChange', listener);
}
/**
 * A new connection specific used for [`transactionExclusiveAsync`](#transactionexclusiveasynctask).
 * @hidden not going to pull all the database methods to the document.
 */
class Transaction extends Database {
    static async createAsync(db) {
        const nativeDatabase = new ExpoSQLite.NativeDatabase(db.dbName, { useNewConnection: true });
        await nativeDatabase.initAsync();
        return new Transaction(db.dbName, nativeDatabase);
    }
}
//# sourceMappingURL=Database.js.map