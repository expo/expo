import type { SQLiteOpenOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';
declare const _default: {
    NativeDatabase(databaseName: string, appGroup?: string | null, options?: SQLiteOpenOptions, serializedData?: Uint8Array): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databaseName: string, appGroup: string | null): Promise<void>;
    deleteDatabaseSync(databaseName: string, appGroup: string | null): void;
    importAssetDatabaseAsync(databaseName: string, appGroup: string | null, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
    addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map