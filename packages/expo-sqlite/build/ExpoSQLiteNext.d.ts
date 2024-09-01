import type { SQLiteOpenOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';
declare const _default: {
    NativeDatabase(databasePath: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array): void;
    ensureDatabasePathExistsAsync(databasePath: string): Promise<void>;
    ensureDatabasePathExistsSync(databasePath: string): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databasePath: string): Promise<void>;
    deleteDatabaseSync(databasePath: string): void;
    importAssetDatabaseAsync(databasePath: string, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
    addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map