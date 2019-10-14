import './polyfillNextTick';
import { WebSQLDatabase } from './SQLite.types';
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: (db: WebSQLDatabase) => void): WebSQLDatabase;
