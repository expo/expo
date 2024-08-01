import spawnAsync, { SpawnOptions, SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { PackageManager, PackageManagerOptions } from '../PackageManager';
import { PendingSpawnPromise } from '../utils/spawn';
export declare abstract class BasePackageManager implements PackageManager {
    readonly silent: boolean;
    readonly log?: (...args: any) => void;
    readonly options: PackageManagerOptions;
    constructor({ silent, log, env, ...options }?: PackageManagerOptions);
    /** Get the name of the package manager */
    abstract readonly name: string;
    /** Get the executable binary of the package manager */
    abstract readonly bin: string;
    /** Get the lockfile for this package manager */
    abstract readonly lockFile: string;
    /** Get the default environment variables used when running the package manager. */
    protected getDefaultEnvironment(): Record<string, string>;
    abstract addAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract addDevAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract addGlobalAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract removeAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract removeDevAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract removeGlobalAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    abstract workspaceRoot(): PackageManager | null;
    /** Ensure the CWD is set to a non-empty string */
    protected ensureCwdDefined(method?: string): string;
    runAsync(command: string[], options?: SpawnOptions): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    runBinAsync(command: string[], options?: SpawnOptions): spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    installAsync(flags?: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    uninstallAsync(): Promise<void>;
}
