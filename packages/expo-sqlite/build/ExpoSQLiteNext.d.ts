import type { SQLiteOpenOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';
declare const _default: {
    NativeDatabase(databasePath: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array): void;
    ensureHasAccessAsync(databasePath: string): Promise<void>;
    ensureHasAccessSync(databasePath: string): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databaseName: string, directory?: string): Promise<void>;
    deleteDatabaseSync(databaseName: string, directory?: string): void;
    importAssetDatabaseAsync(databasePath: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
    addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map