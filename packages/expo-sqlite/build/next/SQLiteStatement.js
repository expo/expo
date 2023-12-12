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
     * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
     *
     * Attempting to access a finalized statement will result in an error.
     * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
     * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
     *
     * Attempting to access a finalized statement will result in an error.
     * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
        lastInsertRowId: {
            value: lastInsertRowId,
            enumerable: true,
            writable: false,
            configurable: true,
        },
        changes: { value: changes, enumerable: true, writable: false, configurable: true },
        getFirstAsync: {
            value: instance.getFirstAsync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
        },
        getAllAsync: {
            value: instance.getAllAsync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
        },
        resetAsync: {
            value: instance.resetAsync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
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
        lastInsertRowId: {
            value: lastInsertRowId,
            enumerable: true,
            writable: false,
            configurable: true,
        },
        changes: { value: changes, enumerable: true, writable: false, configurable: true },
        getFirstSync: {
            value: instance.getFirstSync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
        },
        getAllSync: {
            value: instance.getAllSync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
        },
        resetSync: {
            value: instance.resetSync.bind(instance),
            enumerable: true,
            writable: false,
            configurable: true,
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
    isStepCalled = false;
    constructor(database, statement, lastInsertRowId, changes, firstRowValues) {
        this.database = database;
        this.statement = statement;
        this.lastInsertRowId = lastInsertRowId;
        this.changes = changes;
        this.firstRowValues = firstRowValues;
    }
    async getFirstAsync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve the first row.');
        }
        this.isStepCalled = true;
        const columnNames = await this.getColumnNamesAsync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRow(columnNames, firstRowValues);
        }
        const firstRow = await this.statement.stepAsync(this.database);
        return firstRow != null ? composeRow(columnNames, firstRow) : null;
    }
    async getAllAsync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve all rows.');
        }
        this.isStepCalled = true;
        const columnNames = await this.getColumnNamesAsync();
        const allRows = await this.statement.getAllAsync(this.database);
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null && firstRowValues.length > 0) {
            return composeRows(columnNames, [firstRowValues, ...allRows]);
        }
        return composeRows(columnNames, allRows);
    }
    async *generatorAsync() {
        this.isStepCalled = true;
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
    resetAsync() {
        const result = this.statement.resetAsync(this.database);
        this.isStepCalled = false;
        return result;
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
    isStepCalled = false;
    constructor(database, statement, lastInsertRowId, changes, firstRowValues) {
        this.database = database;
        this.statement = statement;
        this.lastInsertRowId = lastInsertRowId;
        this.changes = changes;
        this.firstRowValues = firstRowValues;
    }
    getFirstSync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve the first row.');
        }
        const columnNames = this.getColumnNamesSync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRow(columnNames, firstRowValues);
        }
        const firstRow = this.statement.stepSync(this.database);
        return firstRow != null ? composeRow(columnNames, firstRow) : null;
    }
    getAllSync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve all rows.');
        }
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
    resetSync() {
        const result = this.statement.resetSync(this.database);
        this.isStepCalled = false;
        return result;
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