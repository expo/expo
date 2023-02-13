import { BasePackageManager } from './BasePackageManager';
export declare class PnpmPackageManager extends BasePackageManager {
    readonly name = "pnpm";
    readonly bin = "pnpm";
    readonly lockFile = "pnpm-lock.yaml";
    workspaceRoot(): PnpmPackageManager | null;
    installAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addDevAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    addGlobalAsync(namesOrFlags?: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeDevAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    removeGlobalAsync(namesOrFlags: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
}
