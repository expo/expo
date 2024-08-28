import type { SQLiteOpenOptions, IOSOptions } from './NativeDatabase';
import type { DatabaseChangeEvent } from './SQLiteDatabase';
declare const _default: {
    NativeDatabase(databaseName: string, iosOptions?: IOSOptions, options?: SQLiteOpenOptions, serializedData?: Uint8Array): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databaseName: string, iosOptions: IOSOptions): Promise<void>;
    deleteDatabaseSync(databaseName: string, iosOptions: IOSOptions): void;
    importAssetDatabaseAsync(databaseName: string, iosOptions: IOSOptions, assetDatabasePath: string, forceOverwrite: boolean): Promise<void>;
    addListener(eventName: string, listener: (event: DatabaseChangeEvent) => void): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map