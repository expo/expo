/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class Statement {
    nativeDatabase;
    nativeStatement;
    constructor(nativeDatabase, nativeStatement) {
        this.nativeDatabase = nativeDatabase;
        this.nativeStatement = nativeStatement;
    }
    async runAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return await this.nativeStatement.objectRunAsync(this.nativeDatabase, bindParams);
        }
        else {
            return await this.nativeStatement.arrayRunAsync(this.nativeDatabase, bindParams);
        }
    }
    async *eachAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const func = shouldPassAsObject
            ? this.nativeStatement.objectGetAsync.bind(this.nativeStatement)
            : this.nativeStatement.arrayGetAsync.bind(this.nativeStatement);
        const columnNames = await this.getColumnNamesAsync();
        let result = null;
        do {
            result = await func(this.nativeDatabase, bindParams);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    async getAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const columnNames = await this.getColumnNamesAsync();
        const columnValues = shouldPassAsObject
            ? await this.nativeStatement.objectGetAsync(this.nativeDatabase, bindParams)
            : await this.nativeStatement.arrayGetAsync(this.nativeDatabase, bindParams);
        return columnValues != null ? composeRow(columnNames, columnValues) : null;
    }
    async allAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const columnNames = await this.getColumnNamesAsync();
        const columnValuesList = shouldPassAsObject
            ? await this.nativeStatement.objectGetAllAsync(this.nativeDatabase, bindParams)
            : await this.nativeStatement.arrayGetAllAsync(this.nativeDatabase, bindParams);
        return composeRows(columnNames, columnValuesList);
    }
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesAsync() {
        return this.nativeStatement.getColumnNamesAsync();
    }
    /**
     * Reset the prepared statement cursor.
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
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return this.nativeStatement.objectRunSync(this.nativeDatabase, bindParams);
        }
        else {
            return this.nativeStatement.arrayRunSync(this.nativeDatabase, bindParams);
        }
    }
    *eachSync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const func = shouldPassAsObject
            ? this.nativeStatement.objectGetSync.bind(this.nativeStatement)
            : this.nativeStatement.arrayGetSync.bind(this.nativeStatement);
        const columnNames = this.getColumnNamesSync();
        let result = null;
        do {
            result = func(this.nativeDatabase, bindParams);
            if (result != null) {
                yield composeRow(columnNames, result);
            }
        } while (result != null);
    }
    getSync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const columnNames = this.getColumnNamesSync();
        const columnValues = shouldPassAsObject
            ? this.nativeStatement.objectGetSync(this.nativeDatabase, bindParams)
            : this.nativeStatement.arrayGetSync(this.nativeDatabase, bindParams);
        return columnValues != null ? composeRow(columnNames, columnValues) : null;
    }
    allSync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const columnNames = this.getColumnNamesSync();
        const columnValuesList = shouldPassAsObject
            ? this.nativeStatement.objectGetAllSync(this.nativeDatabase, bindParams)
            : this.nativeStatement.arrayGetAllSync(this.nativeDatabase, bindParams);
        return composeRows(columnNames, columnValuesList);
    }
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesSync() {
        return this.nativeStatement.getColumnNamesSync();
    }
    /**
     * Reset the prepared statement cursor.
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
 * Normalize the bind params to an array or object.
 * @hidden
 */
export function normalizeParams(...params) {
    let bindParams = params.length > 1 ? params : params[0];
    if (bindParams == null) {
        bindParams = [];
    }
    if (typeof bindParams !== 'object') {
        bindParams = [bindParams];
    }
    const shouldPassAsObject = !Array.isArray(bindParams);
    return {
        params: bindParams,
        shouldPassAsObject,
    };
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
//# sourceMappingURL=Statement.js.map