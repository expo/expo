import './polyfillNextTick';
export declare type Query = {
    sql: string;
    args: unknown[];
};
export declare type ResultSet = {
    error: Error;
} | {
    insertId?: number;
    rowsAffected: number;
    rows: Array<{
        [column: string]: any;
    }>;
};
export declare type SQLiteCallback = (error?: Error | null, resultSet?: ResultSet) => void;
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (db: WebSQLDatabase) => void): WebSQLDatabase;
export interface WebSQLDatabase {
    exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void;
}
declare const _default: {
    openDatabase: typeof openDatabase;
};
export default _default;
