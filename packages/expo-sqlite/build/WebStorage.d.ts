import { type SQLiteStorage } from './Storage';
declare class Storage {
    private readonly storage;
    constructor(storage: SQLiteStorage);
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    get length(): number;
    toString(): string;
}
/**
 * The default instance of the [`SQLiteStorage`](#sqlitestorage-1) class is used as a drop-in implementation for the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) object from the Web.
 */
export declare const localStorage: Storage & Record<string, string | undefined>;
/**
 * Install the `localStorage` on the `globalThis` object.
 */
export declare function installGlobal(): void;
export {};
//# sourceMappingURL=WebStorage.d.ts.map