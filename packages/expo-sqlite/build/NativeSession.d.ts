/**
 * A type that represents a changeset.
 */
export type Changeset = Uint8Array;
type NativeChangeset = ArrayBuffer;
export type SQLiteAnyDatabase = any;
export declare class NativeSession {
    attachAsync(database: SQLiteAnyDatabase, table: string | null): Promise<void>;
    enableAsync(database: SQLiteAnyDatabase, enabled: boolean): Promise<void>;
    closeAsync(database: SQLiteAnyDatabase): Promise<void>;
    createChangesetAsync(database: SQLiteAnyDatabase): Promise<NativeChangeset>;
    createInvertedChangesetAsync(database: SQLiteAnyDatabase): Promise<NativeChangeset>;
    applyChangesetAsync(database: SQLiteAnyDatabase, changeset: NativeChangeset): Promise<void>;
    invertChangesetAsync(database: SQLiteAnyDatabase, changeset: NativeChangeset): Promise<NativeChangeset>;
    attachSync(database: SQLiteAnyDatabase, table: string | null): void;
    enableSync(database: SQLiteAnyDatabase, enabled: boolean): void;
    closeSync(database: SQLiteAnyDatabase): void;
    createChangesetSync(database: SQLiteAnyDatabase): NativeChangeset;
    createInvertedChangesetSync(database: SQLiteAnyDatabase): NativeChangeset;
    applyChangesetSync(database: SQLiteAnyDatabase, changeset: NativeChangeset): void;
    invertChangesetSync(database: SQLiteAnyDatabase, changeset: NativeChangeset): NativeChangeset;
}
export {};
//# sourceMappingURL=NativeSession.d.ts.map