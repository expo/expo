/**
 * A type that represents a changeset.
 */
export type Changeset = Uint8Array;
export type SQLiteAnyDatabase = any;
export declare class NativeSession {
    attachAsync(database: SQLiteAnyDatabase, table: string | null): Promise<void>;
    enableAsync(database: SQLiteAnyDatabase, enabled: boolean): Promise<void>;
    closeAsync(database: SQLiteAnyDatabase): Promise<void>;
    createChangesetAsync(database: SQLiteAnyDatabase): Promise<Changeset>;
    createInvertedChangesetAsync(database: SQLiteAnyDatabase): Promise<Changeset>;
    applyChangesetAsync(database: SQLiteAnyDatabase, changeset: Changeset): Promise<void>;
    invertChangesetAsync(database: SQLiteAnyDatabase, changeset: Changeset): Promise<Changeset>;
    attachSync(database: SQLiteAnyDatabase, table: string | null): void;
    enableSync(database: SQLiteAnyDatabase, enabled: boolean): void;
    closeSync(database: SQLiteAnyDatabase): void;
    createChangesetSync(database: SQLiteAnyDatabase): Changeset;
    createInvertedChangesetSync(database: SQLiteAnyDatabase): Changeset;
    applyChangesetSync(database: SQLiteAnyDatabase, changeset: Changeset): void;
    invertChangesetSync(database: SQLiteAnyDatabase, changeset: Changeset): Changeset;
}
//# sourceMappingURL=NativeSession.d.ts.map