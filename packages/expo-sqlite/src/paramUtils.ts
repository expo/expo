import {
  SQLiteBindBlobParams,
  SQLiteBindParams,
  SQLiteBindPrimitiveParams,
  SQLiteBindValue,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
} from './NativeStatement';

/**
 * Normalize the bind params to data structure that can be passed to native module.
 * The data structure is a tuple of [primitiveParams, blobParams, shouldPassAsArray].
 * @hidden
 */
export function normalizeParams(
  ...params: any[]
): [SQLiteBindPrimitiveParams, SQLiteBindBlobParams, boolean] {
  let bindParams = params.length > 1 ? params : (params[0] as SQLiteBindParams);
  if (bindParams == null) {
    bindParams = [];
  }
  if (
    typeof bindParams !== 'object' ||
    bindParams instanceof ArrayBuffer ||
    ArrayBuffer.isView(bindParams)
  ) {
    bindParams = [bindParams];
  }
  const shouldPassAsArray = Array.isArray(bindParams);
  if (Array.isArray(bindParams)) {
    bindParams = bindParams.reduce<Record<string, SQLiteBindValue>>((acc, value, index) => {
      acc[index] = value;
      return acc;
    }, {});
  }

  const primitiveParams: SQLiteBindPrimitiveParams = {};
  const blobParams: SQLiteBindBlobParams = {};
  for (const key in bindParams) {
    const value = bindParams[key];
    if (value instanceof Uint8Array) {
      blobParams[key] = value;
    } else {
      primitiveParams[key] = value;
    }
  }

  return [primitiveParams, blobParams, shouldPassAsArray];
}

/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export function composeRow<T>(columnNames: SQLiteColumnNames, columnValues: SQLiteColumnValues): T {
  // TODO(cedric): make these types more generic and tighten the returned object type based on provided column names/values
  const row: { [key in SQLiteColumnNames[number]]: SQLiteColumnValues[number] } = {};
  if (columnNames.length !== columnValues.length) {
    throw new Error(
      `Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValues.length}`
    );
  }
  for (let i = 0; i < columnNames.length; i++) {
    row[columnNames[i]] = columnValues[i];
  }
  return row as T;
}

/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export function composeRows<T>(
  columnNames: SQLiteColumnNames,
  columnValuesList: SQLiteColumnValues[]
): T[] {
  if (columnValuesList.length === 0) {
    return [];
  }
  if (columnNames.length !== columnValuesList[0].length) {
    // We only check the first row because SQLite returns the same column count for all rows.
    throw new Error(
      `Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValuesList[0].length}`
    );
  }
  const results: T[] = [];
  for (const columnValues of columnValuesList) {
    // TODO(cedric): make these types more generic and tighten the returned object type based on provided column names/values
    const row: { [key in SQLiteColumnNames[number]]: SQLiteColumnValues[number] } = {};
    for (let i = 0; i < columnNames.length; i++) {
      row[columnNames[i]] = columnValues[i];
    }
    results.push(row as T);
  }
  return results;
}
