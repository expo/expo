import { BasePackageManager } from './BasePackageManager';
export declare class NpmPackageManager extends BasePackageManager {
    readonly name = "npm";
    readonly bin = "npm";
    readonly lockFile = "package-lock.json";
    workspaceRoot(): NpmPackageManager | null;
    addAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult> | import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addDevAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult> | import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addGlobalAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult> | import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeDevAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeGlobalAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
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
