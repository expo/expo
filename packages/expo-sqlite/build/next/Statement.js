import ExpoSQLite from './ExpoSQLiteNext';
/**
 * A prepared statement returned by `Database.prepareAsync()` that can be binded with parameters and executed.
 */
export class Statement {
    databaseId;
    statementId;
    /**
     * @internal
     */
    constructor(databaseId, statementId) {
        this.databaseId = databaseId;
        this.statementId = statementId;
    }
    async runAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return await ExpoSQLite.statementObjectRunAsync(this.databaseId, this.statementId, bindParams);
        }
        else {
            return await ExpoSQLite.statementArrayRunAsync(this.databaseId, this.statementId, bindParams);
        }
    }
    async *eachAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        const func = shouldPassAsObject
            ? ExpoSQLite.statementObjectGetAsync
            : ExpoSQLite.statementArrayGetAsync;
        let result = null;
        do {
            result = await func(this.databaseId, this.statementId, bindParams);
            if (result != null) {
                yield result;
            }
        } while (result != null);
    }
    async getAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return await ExpoSQLite.statementObjectGetAsync(this.databaseId, this.statementId, bindParams);
        }
        else {
            return await ExpoSQLite.statementArrayGetAsync(this.databaseId, this.statementId, bindParams);
        }
    }
    async allAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return await ExpoSQLite.statementObjectGetAllAsync(this.databaseId, this.statementId, bindParams);
        }
        else {
            return await ExpoSQLite.statementArrayGetAllAsync(this.databaseId, this.statementId, bindParams);
        }
    }
    /**
     * Reset the prepared statement cursor.
     */
    async resetAsync() {
        await ExpoSQLite.statementResetAsync(this.databaseId, this.statementId);
    }
    /**
     * Finalize the prepared statement.
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
     */
    async finalizeAsync() {
        await ExpoSQLite.statementFinalizeAsync(this.databaseId, this.statementId);
    }
}
/**
 * Normalize the bind params to an array or object.
 * @hidden
 */
export function normalizeParams(...params) {
    let bindParams = params.length > 1 ? params : params[0];
    if (typeof bindParams !== 'object') {
        bindParams = [bindParams];
    }
    const shouldPassAsObject = !Array.isArray(bindParams);
    return {
        params: bindParams,
        shouldPassAsObject,
    };
}
//# sourceMappingURL=Statement.js.map