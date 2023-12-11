import { composeRow, composeRows, normalizeParams } from './paramUtils';
/**
 * A prepared statement returned by [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource) or [`SQLiteDatabase.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
    nativeDatabase;
    nativeStatement;
    constructor(nativeDatabase, nativeStatement) {
        this.nativeDatabase = nativeDatabase;
        this.nativeStatement = nativeStatement;
    }
    async executeAsync(...params) {
        const { lastInsertRowId, changes, firstRowValues } = await this.nativeStatement.runAsync(this.nativeDatabase, ...normalizeParams(...params));
        return createSQLiteExecuteAsyncResult(this.nativeDatabase, this.nativeStatement, lastInsertRowId, changes, firstRowValues);
    }
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesAsync() {
        return this.nativeStatement.getColumnNamesAsync();
    }
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    async resetAsync() {
        await this.nativeStatement.resetAsync(this.nativeDatabase);
    }
    /**
     * Finalize the prepared statement.
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
     */
    async finalizeAsync() {
        await this.nativeStatement.finalizeAsync(this.nativeDatabase);
    }
    executeSync(...params) {
        const { lastInsertRowId, changes, firstRowValues } = this.nativeStatement.runSync(this.nativeDatabase, ...normalizeParams(...params));
        return createSQLiteExecuteSyncResult(this.nativeDatabase, this.nativeStatement, lastInsertRowId, changes, firstRowValues);
    }
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesSync() {
        return this.nativeStatement.getColumnNamesSync();
    }
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    resetSync() {
        this.nativeStatement.resetSync(this.nativeDatabase);
    }
    /**
     * Finalize the prepared statement.
     *
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareSync()` to avoid resource leaks.
     *
     */
    finalizeSync() {
        this.nativeStatement.finalizeSync(this.nativeDatabase);
    }
}
//#region Internals for SQLiteExecuteAsyncResult and SQLiteExecuteSyncResult
/**
 * Create the `SQLiteExecuteAsyncResult` instance.
 *
 * NOTE: Since Hermes does not support the `Symbol.asyncIterator` feature, we have to use an AsyncGenerator to implement the `AsyncIterableIterator` interface.
 * This is done by `Object.defineProperties` to add the properties to the AsyncGenerator.
 */
async function createSQLiteExecuteAsyncResult(database, statement, lastInsertRowId, changes, firstRowValues) {
    const instance = new SQLiteExecuteAsyncResultImpl(database, statement, lastInsertRowId, changes, firstRowValues);
    const generator = instance.generatorAsync();
    Object.defineProperties(generator, {
        lastInsertRowId: { value: lastInsertRowId, enumerable: true, writable: false },
        changes: { value: changes, enumerable: true, writable: false },
        getFirstAsync: {
            value: instance.getFirstAsync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: false,
        },
        getAllAsync: {
            value: instance.getAllAsync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: false,
        },
    });
    return generator;
}
/**
 * Create the `SQLiteExecuteSyncResult` instance.
 */
function createSQLiteExecuteSyncResult(database, statement, lastInsertRowId, changes, firstRowValues) {
    const instance = new SQLiteExecuteSyncResultImpl(database, statement, lastInsertRowId, changes, firstRowValues);
    const generator = instance.generatorSync();
    Object.defineProperties(generator, {
        lastInsertRowId: { value: lastInsertRowId, enumerable: true, writable: false },
        changes: { value: changes, enumerable: true, writable: false },
        getFirstSync: {
            value: instance.getFirstSync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: false,
        },
        getAllSync: {
            value: instance.getAllSync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: false,
        },
    });
    return generator;
}
class SQLiteExecuteAsyncResultImpl {
    database;
    statement;
    lastInsertRowId;
    changes;
    firstRowValues;
    columnNames = null;
    constructor(database, statement, lastInsertRowId, changes, firstRowValues) {
        this.database = database;
        this.statement = statement;
        this.lastInsertRowId = lastInsertRowId;
        this.changes = changes;
        this.firstRowValues = firstRowValues;
    }
    async getFirstAsync() {
        const columnNames = await this.getColumnNamesAsync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRow(columnNames, firstRowValues);
        }
        const firstRow = await this.statement.stepAsync(this.database);
        return firstRow != null ? composeRow(columnNames, firstRow) : null;
    }
    async getAllAsync() {
        const columnNames = await this.getColumnNamesAsync();
        const allRows = await this.statement.getAllAsync(this.database);
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null && firstRowValues.length > 0) {
            return composeRows(columnNames, [firstRowValues, ...allRows]);
        }
        return composeRows(columnNames, allRows);
    }
    async *generatorAsync() {
        const columnNames = await this.getColumnNamesAsync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            yield composeRow(columnNames, firstRowValues);
        }
        let result;
        do {
            result = await this.statement.stepAsync(this.database);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    popFirstRowValues() {
        if (this.firstRowValues != null) {
            const firstRowValues = this.firstRowValues;
            this.firstRowValues = null;
            return firstRowValues.length > 0 ? firstRowValues : null;
        }
        return null;
    }
    async getColumnNamesAsync() {
        if (this.columnNames == null) {
            this.columnNames = await this.statement.getColumnNamesAsync();
        }
        return this.columnNames;
    }
}
class SQLiteExecuteSyncResultImpl {
    database;
    statement;
    lastInsertRowId;
    changes;
    firstRowValues;
    columnNames = null;
    constructor(database, statement, lastInsertRowId, changes, firstRowValues) {
        this.database = database;
        this.statement = statement;
        this.lastInsertRowId = lastInsertRowId;
        this.changes = changes;
        this.firstRowValues = firstRowValues;
    }
    getFirstSync() {
        const columnNames = this.getColumnNamesSync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRow(columnNames, firstRowValues);
        }
        const firstRow = this.statement.stepSync(this.database);
        return firstRow != null ? composeRow(columnNames, firstRow) : null;
    }
    getAllSync() {
        const columnNames = this.getColumnNamesSync();
        const allRows = this.statement.getAllSync(this.database);
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null && firstRowValues.length > 0) {
            return composeRows(columnNames, [firstRowValues, ...allRows]);
        }
        return composeRows(columnNames, allRows);
    }
    *generatorSync() {
        const columnNames = this.getColumnNamesSync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            yield composeRow(columnNames, firstRowValues);
        }
        let result;
        do {
            result = this.statement.stepSync(this.database);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    popFirstRowValues() {
        if (this.firstRowValues != null) {
            const firstRowValues = this.firstRowValues;
            this.firstRowValues = null;
            return firstRowValues.length > 0 ? firstRowValues : null;
        }
        return null;
    }
    getColumnNamesSync() {
        if (this.columnNames == null) {
            this.columnNames = this.statement.getColumnNamesSync();
        }
        return this.columnNames;
    }
}
//#endregion
//# sourceMappingURL=SQLiteStatement.js.map