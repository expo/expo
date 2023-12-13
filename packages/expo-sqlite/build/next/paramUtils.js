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
//# sourceMappingURL=paramUtils.js.map