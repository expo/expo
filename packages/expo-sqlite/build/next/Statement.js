/**
 * A prepared statement returned by `Database.prepareAsync()` that can be binded with parameters and executed.
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
        let result = null;
        do {
            result = await func(this.nativeDatabase, bindParams);
            if (result != null) {
                yield result;
            }
        } while (result != null);
    }
    async getAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return (await this.nativeStatement.objectGetAsync(this.nativeDatabase, bindParams)) ?? null;
        }
        else {
            return (await this.nativeStatement.arrayGetAsync(this.nativeDatabase, bindParams)) ?? null;
        }
    }
    async allAsync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return await this.nativeStatement.objectGetAllAsync(this.nativeDatabase, bindParams);
        }
        else {
            return await this.nativeStatement.arrayGetAllAsync(this.nativeDatabase, bindParams);
        }
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
        let result = null;
        do {
            result = func(this.nativeDatabase, bindParams);
            if (result != null) {
                yield result;
            }
        } while (result != null);
    }
    getSync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return this.nativeStatement.objectGetSync(this.nativeDatabase, bindParams) ?? null;
        }
        else {
            return this.nativeStatement.arrayGetSync(this.nativeDatabase, bindParams) ?? null;
        }
    }
    allSync(...params) {
        const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
        if (shouldPassAsObject) {
            return this.nativeStatement.objectGetAllSync(this.nativeDatabase, bindParams);
        }
        else {
            return this.nativeStatement.arrayGetAllSync(this.nativeDatabase, bindParams);
        }
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
//# sourceMappingURL=Statement.js.map