import { composeRow, composeRows, normalizeParams } from './paramUtils';
/**
 * A lightweight async mutex that serializes access to a native prepared statement
 * during the brief window between runAsync() and getAllAsync() in executeAsync().
 * This prevents another caller's runAsync() from resetting the cursor before
 * the first caller finishes draining rows.
 */
class StatementMutex {
    _queue = Promise.resolve();
    /**
     * Run `fn` exclusively — subsequent calls wait for prior ones to finish.
     * The lock is held only for the duration of `fn`, not for result consumption.
     */
    run(fn) {
        const prev = this._queue;
        let resolve;
        this._queue = new Promise((r) => {
            resolve = r;
        });
        return prev.then(fn).finally(() => resolve());
    }
}
/**
 * A prepared statement returned by [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource) or [`SQLiteDatabase.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
    nativeDatabase;
    nativeStatement;
    _mutex = new StatementMutex();
    constructor(nativeDatabase, nativeStatement) {
        this.nativeDatabase = nativeDatabase;
        this.nativeStatement = nativeStatement;
    }
    async executeAsync(...params) {
        // Mutex ensures runAsync + getAllAsync execute atomically — no other caller
        // can reset the native cursor between first-row capture and row drain.
        // The mutex is released before the result object is returned, so result
        // consumption (getFirstAsync, getAllAsync, iterator) is never blocked.
        const { lastInsertRowId, changes, firstRowValues, remainingRows } = await this._mutex.run(async () => {
            const result = await this.nativeStatement.runAsync(this.nativeDatabase, ...normalizeParams(...params));
            let remaining = [];
            if (result.firstRowValues != null && result.firstRowValues.length > 0) {
                remaining = await this.nativeStatement.getAllAsync(this.nativeDatabase);
            }
            return { ...result, remainingRows: remaining };
        });
        return createSQLiteExecuteAsyncResult(this.nativeDatabase, this.nativeStatement, firstRowValues, {
            rawResult: false,
            lastInsertRowId,
            changes,
        }, remainingRows);
    }
    async executeForRawResultAsync(...params) {
        const { lastInsertRowId, changes, firstRowValues, remainingRows } = await this._mutex.run(async () => {
            const result = await this.nativeStatement.runAsync(this.nativeDatabase, ...normalizeParams(...params));
            let remaining = [];
            if (result.firstRowValues != null && result.firstRowValues.length > 0) {
                remaining = await this.nativeStatement.getAllAsync(this.nativeDatabase);
            }
            return { ...result, remainingRows: remaining };
        });
        return createSQLiteExecuteAsyncResult(this.nativeDatabase, this.nativeStatement, firstRowValues, {
            rawResult: true,
            lastInsertRowId,
            changes,
        }, remainingRows);
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
     * > **Note:** While `expo-sqlite` will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice
     * > to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks.
     * > You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
     */
    async finalizeAsync() {
        await this.nativeStatement.finalizeAsync(this.nativeDatabase);
    }
    executeSync(...params) {
        const { lastInsertRowId, changes, firstRowValues } = this.nativeStatement.runSync(this.nativeDatabase, ...normalizeParams(...params));
        return createSQLiteExecuteSyncResult(this.nativeDatabase, this.nativeStatement, firstRowValues, {
            rawResult: false,
            lastInsertRowId,
            changes,
        });
    }
    executeForRawResultSync(...params) {
        const { lastInsertRowId, changes, firstRowValues } = this.nativeStatement.runSync(this.nativeDatabase, ...normalizeParams(...params));
        return createSQLiteExecuteSyncResult(this.nativeDatabase, this.nativeStatement, firstRowValues, {
            rawResult: true,
            lastInsertRowId,
            changes,
        });
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
     *
     * > **Note:** While `expo-sqlite` will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice
     * > to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks.
     * > You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
     */
    finalizeSync() {
        this.nativeStatement.finalizeSync(this.nativeDatabase);
    }
}
/**
 * Create the `SQLiteExecuteAsyncResult` instance.
 *
 * NOTE: Since Hermes does not support the `Symbol.asyncIterator` feature, we have to use an AsyncGenerator to implement the `AsyncIterableIterator` interface.
 * This is done by `Object.defineProperties` to add the properties to the AsyncGenerator.
 */
async function createSQLiteExecuteAsyncResult(database, statement, firstRowValues, options, remainingRows) {
    const instance = new SQLiteExecuteAsyncResultImpl(database, statement, firstRowValues ? processNativeRow(firstRowValues) : null, options, remainingRows ? processNativeRows(remainingRows) : undefined);
    const generator = instance.generatorAsync();
    Object.defineProperties(generator, {
        lastInsertRowId: {
            value: options.lastInsertRowId,
            enumerable: true,
            writable: false,
            configurable: true,
        },
        changes: { value: options.changes, enumerable: true, writable: false, configurable: true },
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
function createSQLiteExecuteSyncResult(database, statement, firstRowValues, options) {
    const instance = new SQLiteExecuteSyncResultImpl(database, statement, firstRowValues ? processNativeRow(firstRowValues) : firstRowValues, options);
    const generator = instance.generatorSync();
    Object.defineProperties(generator, {
        lastInsertRowId: {
            value: options.lastInsertRowId,
            enumerable: true,
            writable: false,
            configurable: true,
        },
        changes: { value: options.changes, enumerable: true, writable: false, configurable: true },
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
    firstRowValues;
    options;
    columnNames = null;
    isStepCalled = false;
    /**
     * All result rows, eagerly materialized during executeAsync() to prevent
     * cursor corruption when a shared PreparedStatement is reused concurrently.
     * When set, the result object is fully detached from the native cursor.
     */
    allRows;
    iteratorIndex = 0;
    constructor(database, statement, firstRowValues, options, remainingRows) {
        this.database = database;
        this.statement = statement;
        this.firstRowValues = firstRowValues;
        this.options = options;
        // Build the complete row array: first row + remaining rows
        if (remainingRows != null) {
            if (firstRowValues != null && firstRowValues.length > 0) {
                this.allRows = [firstRowValues, ...remainingRows];
            }
            else {
                this.allRows = [];
            }
        }
    }
    async getFirstAsync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve the first row.');
        }
        this.isStepCalled = true;
        const columnNames = await this.getColumnNamesAsync();
        // Use pre-materialized rows if available
        if (this.allRows != null) {
            return this.allRows.length > 0
                ? composeRowIfNeeded(this.options.rawResult, columnNames, this.allRows[0])
                : null;
        }
        // Legacy path: no materialized rows (sync callers, etc.)
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRowIfNeeded(this.options.rawResult, columnNames, firstRowValues);
        }
        const firstRow = await this.statement.stepAsync(this.database);
        return firstRow != null
            ? composeRowIfNeeded(this.options.rawResult, columnNames, processNativeRow(firstRow))
            : null;
    }
    async getAllAsync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve all rows.');
        }
        this.isStepCalled = true;
        // Use pre-materialized rows if available
        if (this.allRows != null) {
            const columnNames = await this.getColumnNamesAsync();
            return composeRowsIfNeeded(this.options.rawResult, columnNames, this.allRows);
        }
        // Legacy path: no materialized rows
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues == null) {
            // If the first row is empty, this SQL query may be a write operation.
            // We should not call statement.getAllAsync() to re-execute.
            return [];
        }
        const columnNames = await this.getColumnNamesAsync();
        const nativeRows = await this.statement.getAllAsync(this.database);
        const allRows = processNativeRows(nativeRows);
        if (firstRowValues != null && firstRowValues.length > 0) {
            return composeRowsIfNeeded(this.options.rawResult, columnNames, [
                firstRowValues,
                ...allRows,
            ]);
        }
        return composeRowsIfNeeded(this.options.rawResult, columnNames, allRows);
    }
    async *generatorAsync() {
        this.isStepCalled = true;
        const columnNames = await this.getColumnNamesAsync();
        // Use pre-materialized rows if available — fully detached from native cursor
        if (this.allRows != null) {
            while (this.iteratorIndex < this.allRows.length) {
                yield composeRowIfNeeded(this.options.rawResult, columnNames, this.allRows[this.iteratorIndex++]);
            }
        }
        else {
            // Legacy path: no materialized rows
            const firstRowValues = this.popFirstRowValues();
            if (firstRowValues != null) {
                yield composeRowIfNeeded(this.options.rawResult, columnNames, firstRowValues);
            }
            let result;
            do {
                result = await this.statement.stepAsync(this.database);
                if (result != null) {
                    yield composeRowIfNeeded(this.options.rawResult, columnNames, processNativeRow(result));
                }
            } while (result != null);
        }
    }
    async resetAsync() {
        if (this.allRows == null) {
            // Legacy path: reset the native cursor for non-materialized results
            await this.statement.resetAsync(this.database);
        }
        // For materialized results, only reset JS-side state — no native cursor access
        this.isStepCalled = false;
        this.iteratorIndex = 0;
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
    firstRowValues;
    options;
    columnNames = null;
    isStepCalled = false;
    constructor(database, statement, firstRowValues, options) {
        this.database = database;
        this.statement = statement;
        this.firstRowValues = firstRowValues;
        this.options = options;
    }
    getFirstSync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve the first row.');
        }
        const columnNames = this.getColumnNamesSync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            return composeRowIfNeeded(this.options.rawResult, columnNames, firstRowValues);
        }
        const firstRow = this.statement.stepSync(this.database);
        return firstRow != null
            ? composeRowIfNeeded(this.options.rawResult, columnNames, processNativeRow(firstRow))
            : null;
    }
    getAllSync() {
        if (this.isStepCalled) {
            throw new Error('The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve all rows.');
        }
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues == null) {
            // If the first row is empty, this SQL query may be a write operation. We should not call `statement.getAllAsync()` to write again.
            return [];
        }
        const columnNames = this.getColumnNamesSync();
        const nativeRows = this.statement.getAllSync(this.database);
        const allRows = processNativeRows(nativeRows);
        if (firstRowValues != null && firstRowValues.length > 0) {
            return composeRowsIfNeeded(this.options.rawResult, columnNames, [
                firstRowValues,
                ...allRows,
            ]);
        }
        return composeRowsIfNeeded(this.options.rawResult, columnNames, allRows);
    }
    *generatorSync() {
        const columnNames = this.getColumnNamesSync();
        const firstRowValues = this.popFirstRowValues();
        if (firstRowValues != null) {
            yield composeRowIfNeeded(this.options.rawResult, columnNames, firstRowValues);
        }
        let result;
        do {
            result = this.statement.stepSync(this.database);
            if (result != null) {
                yield composeRowIfNeeded(this.options.rawResult, columnNames, processNativeRow(result));
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
function composeRowIfNeeded(rawResult, columnNames, columnValues) {
    return rawResult
        ? columnValues // T would be a ValuesOf<> from caller
        : composeRow(columnNames, columnValues);
}
function composeRowsIfNeeded(rawResult, columnNames, columnValuesList) {
    return rawResult
        ? columnValuesList // T[] would be a ValuesOf<>[] from caller
        : composeRows(columnNames, columnValuesList);
}
function processNativeRow(nativeRow) {
    return nativeRow?.map((column) => column instanceof ArrayBuffer ? new Uint8Array(column) : column);
}
function processNativeRows(nativeRows) {
    return nativeRows.map(processNativeRow);
}
//#endregion
//# sourceMappingURL=SQLiteStatement.js.map