import { BasePackageManager } from './BasePackageManager';
export declare class YarnPackageManager extends BasePackageManager {
    readonly name = "yarn";
    readonly bin = "yarnpkg";
    readonly lockFile = "yarn.lock";
    /** Check if Yarn is running in offline mode, and add the `--offline` flag */
    private withOfflineFlagAsync;
    workspaceRoot(): YarnPackageManager | null;
    installAsync(flags?: string[]): import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addAsync(namesOrFlags?: string[]): import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addDevAsync(namesOrFlags?: string[]): import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addGlobalAsync(namesOrFlags?: string[]): import("../utils/spawn").PendingSpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeDevAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeGlobalAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
}
