import type { SQLiteOpenOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';
declare const _default: {
    NativeDatabase(databaseName: string, directory?: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array): void;
    ensureHasAccessAsync(databaseName: string, directory: string): Promise<void>;
    ensureHasAccessSync(databaseName: string, directory: string): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databaseName: string, directory?: string): Promise<void>;
    deleteDatabaseSync(databaseName: string, directory?: string): void;
    importAssetDatabaseAsync(databaseName: string, directory: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
    addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map