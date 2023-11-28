/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
    nativeDatabase;
    nativeStatement;
    constructor(nativeDatabase, nativeStatement) {
        this.nativeDatabase = nativeDatabase;
        this.nativeStatement = nativeStatement;
    }
    async runAsync(...params) {
        return await this.nativeStatement.runAsync(this.nativeDatabase, ...normalizeParams(...params));
    }
    async *eachAsync(...params) {
        const paramTuple = normalizeParams(...params);
        const func = this.nativeStatement.getAsync.bind(this.nativeStatement);
        const columnNames = await this.getColumnNamesAsync();
        let result = null;
        do {
            result = await func(this.nativeDatabase, ...paramTuple);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    async getAsync(...params) {
        const columnNames = await this.getColumnNamesAsync();
        const columnValues = await this.nativeStatement.getAsync(this.nativeDatabase, ...normalizeParams(...params));
        return columnValues != null ? composeRow(columnNames, columnValues) : null;
    }
    async allAsync(...params) {
        const columnNames = await this.getColumnNamesAsync();
        const columnValuesList = await this.nativeStatement.getAllAsync(this.nativeDatabase, ...normalizeParams(...params));
        return composeRows(columnNames, columnValuesList);
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
    runSync(...params) {
        return this.nativeStatement.runSync(this.nativeDatabase, ...normalizeParams(...params));
    }
    *eachSync(...params) {
        const paramTuple = normalizeParams(...params);
        const func = this.nativeStatement.getSync.bind(this.nativeStatement);
        const columnNames = this.getColumnNamesSync();
        let result = null;
        do {
            result = func(this.nativeDatabase, ...paramTuple);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    getSync(...params) {
        const columnNames = this.getColumnNamesSync();
        const columnValues = this.nativeStatement.getSync(this.nativeDatabase, ...normalizeParams(...params));
        return columnValues != null ? composeRow(columnNames, columnValues) : null;
    }
    allSync(...params) {
        const columnNames = this.getColumnNamesSync();
        const columnValuesList = this.nativeStatement.getAllSync(this.nativeDatabase, ...normalizeParams(...params));
        return composeRows(columnNames, columnValuesList);
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
/**
 * Normalize the bind params to data structure that can be passed to native module.
 * The data structure is a tuple of [primitiveParams, blobParams, shouldPassAsArray].
 * @hidden
 */
export function normalizeParams(...params) {
    let bindParams = params.length > 1 ? params : params[0];
    if (bindParams == null) {
        bindParams = [];
    }
    if (typeof bindParams !== 'object' ||
        bindParams instanceof ArrayBuffer ||
        ArrayBuffer.isView(bindParams)) {
        bindParams = [bindParams];
    }
    const shouldPassAsArray = Array.isArray(bindParams);
    if (Array.isArray(bindParams)) {
        bindParams = bindParams.reduce((acc, value, index) => {
            acc[index] = value;
            return acc;
        }, {});
    }
    const primitiveParams = {};
    const blobParams = {};
    for (const key in bindParams) {
        const value = bindParams[key];
        if (value instanceof Uint8Array) {
            blobParams[key] = value;
        }
        else {
            primitiveParams[key] = value;
        }
    }
    return [primitiveParams, blobParams, shouldPassAsArray];
}
/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export function composeRow(columnNames, columnValues) {
    const row = {};
    if (columnNames.length !== columnValues.length) {
        throw new Error(`Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValues.length}`);
    }
    for (let i = 0; i < columnNames.length; i++) {
        row[columnNames[i]] = columnValues[i];
    }
    return row;
}
/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export function composeRows(columnNames, columnValuesList) {
    if (columnValuesList.length === 0) {
        return [];
    }
    if (columnNames.length !== columnValuesList[0].length) {
        // We only check the first row because SQLite returns the same column count for all rows.
        throw new Error(`Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValuesList[0].length}`);
    }
    const results = [];
    for (const columnValues of columnValuesList) {
        const row = {};
        for (let i = 0; i < columnNames.length; i++) {
            row[columnNames[i]] = columnValues[i];
        }
        results.push(row);
    }
    return results;
}
//# sourceMappingURL=SQLiteStatement.js.map