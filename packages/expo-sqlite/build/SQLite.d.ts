import './polyfillNextTick';
declare type InternalResultSet = {
    error: Error;
} | {
    insertId?: number;
    rowsAffected: number;
    rows: Array<{
        [column: string]: any;
    }>;
};
export declare type SQLiteCallback = (error?: Error | null, resultSet?: InternalResultSet) => void;
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (db: WebSQLDatabase) => void): WebSQLDatabase;
declare type WebSQLDatabase = unknown;
declare const _default: {
    openDatabase: typeof openDatabase;
};
export default _default;
