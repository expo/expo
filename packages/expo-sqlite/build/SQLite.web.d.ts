import { DatabaseCallback } from './SQLite.types';
export declare function openDatabase(name: string, version?: string, description?: string, size?: number, callback?: DatabaseCallback): import("./SQLite.types").Database;
