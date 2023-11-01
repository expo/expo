import { OpenOptions } from './NativeDatabase';
declare const _default: {
    readonly name: string;
    NativeDatabase(dbName: string, options?: OpenOptions): void;
    NativeStatement(): void;
    deleteDatabaseAsync(dbName: string): Promise<void>;
    deleteDatabaseSync(dbName: string): void;
    addListener(): never;
    removeListeners(): never;
};
export default _default;
//# sourceMappingURL=ExpoSQLiteNext.d.ts.map