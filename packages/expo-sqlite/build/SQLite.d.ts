import './polyfillNextTick';
import { WebSQLDatabase, SQLiteFileInfo } from './SQLite.types';
export declare function openDatabase(fileInfo: SQLiteFileInfo | string, version: string | undefined, description: string, size?: number, callback?: (db: WebSQLDatabase) => void): WebSQLDatabase;
