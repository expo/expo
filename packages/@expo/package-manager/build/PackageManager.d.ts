import { SpawnOptions, SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { PendingSpawnPromise } from './utils/spawn';
export interface PackageManagerOptions extends SpawnOptions {
    /**
     * If the package manager should run in silent mode.
     * Note, this will hide possible error output from executed commands.
     * When running in silent mode, make sure you handle them properly.
     */
    silent?: boolean;
    /**
     * The logging method used to communicate the command which is executed.
     * Without `silent`, this defaults to `console.log`.
     * When `silent` is set to `true`, this defaults to a no-op.
     */
    log?: (...args: any[]) => void;
}
export interface PackageManager {
    /** The options for this package manager */
    readonly options: PackageManagerOptions;
    /** Run any command using the package manager */
    runAsync(command: string[]): SpawnPromise<SpawnResult>;
    /** Get the version of the used package manager */
    versionAsync(): Promise<string>;
    /** Get a single configuration property from the package manager */
    getConfigAsync(key: string): Promise<string>;
    /** Remove the lock file within the project, if any */
    removeLockfileAsync(): Promise<void>;
    /** Get the workspace root package manager, if this project is within a workspace/monorepo */
    workspaceRoot(): PackageManager | null;
    /** Install all current dependencies using the package manager */
    installAsync(): Promise<SpawnResult> | SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Uninstall all current dependencies by removing the folder containing the packages */
    uninstallAsync(): Promise<void>;
    /** Add a normal dependency to the project */
    addAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Initiates adding a normal dependency, but return the command string to be run later instead of the command itself.
     * This output is intended to be used in a detached child process, e.g. when a package updates itself, especially when chained to other commands.
     * Thus, addDeferredAsync() should generally be the last use of PackageManager before the current process exits.
     */
    addDeferredAsync(namesOrFlags: string[]): Promise<string>;
    /** Add a development dependency to the project */
    addDevAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Add a global dependency to the environment */
    addGlobalAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Remove a normal dependency from the project */
    removeAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Remove a development dependency from the project */
    removeDevAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
    /** Remove a global dependency from the environments */
    removeGlobalAsync(namesOrFlags: string[]): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
}
