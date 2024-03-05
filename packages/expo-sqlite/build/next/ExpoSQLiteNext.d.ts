import { SQLiteOpenOptions } from './NativeDatabase';
declare const _default: {
    NativeDatabase(databaseName: string, options?: SQLiteOpenOptions): void;
    NativeStatement(): void;
    deleteDatabaseAsync(databaseName: string): Promise<void>;
    deleteDatabaseSync(databaseName: string): void;
    addListener(): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map