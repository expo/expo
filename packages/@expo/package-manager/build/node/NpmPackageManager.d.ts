import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import { BasePackageManager } from './BasePackageManager';
export declare class NpmPackageManager extends BasePackageManager {
    readonly name = "npm";
    readonly bin = "npm";
    readonly lockFile = "package-lock.json";
    workspaceRoot(): NpmPackageManager | null;
    addAsync(namesOrFlags?: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult> | import("../utils/spawn").PendingSpawnPromise<spawnAsync.SpawnResult>;
    addDevAsync(namesOrFlags?: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult> | import("../utils/spawn").PendingSpawnPromise<spawnAsync.SpawnResult>;
    addGlobalAsync(namesOrFlags?: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult> | import("../utils/spawn").PendingSpawnPromise<spawnAsync.SpawnResult>;
    removeAsync(namesOrFlags: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    removeDevAsync(namesOrFlags: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    removeGlobalAsync(namesOrFlags: string[]): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    runBinAsync(command: string[], options?: SpawnOptions): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    /**
     * Parse all package specifications from the names or flag list.
     * The result from this method can be used for `.updatePackageFileAsync`.
     */
    private parsePackageSpecs;
    /**
     * Older npm versions have issues with mismatched nested dependencies when adding exact versions.
     * This propagates as issues like mismatched `@expo/config-pugins` versions.
     * As a workaround, we update the `package.json` directly and run `npm install`.
     */
    private updatePackageFileAsync;
}
