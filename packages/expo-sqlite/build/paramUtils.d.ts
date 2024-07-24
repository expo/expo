import { SQLiteBindBlobParams, SQLiteBindPrimitiveParams, type SQLiteColumnNames, type SQLiteColumnValues } from './NativeStatement';
/**
 * Normalize the bind params to data structure that can be passed to native module.
 * The data structure is a tuple of [primitiveParams, blobParams, shouldPassAsArray].
 * @hidden
 */
export declare function normalizeParams(...params: any[]): [SQLiteBindPrimitiveParams, SQLiteBindBlobParams, boolean];
/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export declare function composeRow<T>(columnNames: SQLiteColumnNames, columnValues: SQLiteColumnValues): T;
/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export declare function composeRows<T>(columnNames: SQLiteColumnNames, columnValuesList: SQLiteColumnValues[]): T[];
//# sourceMappingURL=paramUtils.d.ts.map