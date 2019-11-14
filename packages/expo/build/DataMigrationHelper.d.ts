export interface ConflictResolver {
    onConflict(legacyFile: string, currentFile: string): Promise<void>;
}
export declare const LOCK_FILE_NAME = "migrationLock#6453743";
export declare function getLegacyDocumentDirectoryAndroid(): string | null;
export declare const NOOP_CONFLICT_RESOLVER: ConflictResolver;
export declare function migrateFilesFromLegacyDirectoryAsync(conflictResolver?: ConflictResolver): Promise<void>;
