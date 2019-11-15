export interface ConflictResolver {
    (legacyFile: string, currentFile: string): Promise<void>;
}
export declare const LOCK_FILE_NAME = "migrationLock64537438658125";
export declare function getLegacyDocumentDirectoryAndroid(): string | null;
export declare const noopResolve: ConflictResolver;
export declare function migrateFilesFromLegacyDirectoryAsync(resolveConflict?: ConflictResolver): Promise<void>;
