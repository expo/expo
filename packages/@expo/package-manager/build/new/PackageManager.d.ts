import { SpawnOptions, SpawnPromise, SpawnResult } from '@expo/spawn-async';
export interface PackageManagerOptions extends SpawnOptions {
    logger?: (...args: any[]) => void;
    silent?: boolean;
}
export interface PackageManager {
    /** The options for this package manager */
    readonly options: PackageManagerOptions;
    /** Run any command using the package manager */
    runAsync(command: string[]): SpawnPromise<SpawnResult>;
    /** Get the version of the used package manager */
    versionAsync(): Promise<string>;
    /** Get a single configuration property from the package manager */
    configAsync(key: string): Promise<string>;
    /** Remove the lock file within the project, if any */
    removeLockFileAsync(): Promise<void>;
    /** Get the workspace root, if this project is within a workspace/monorepo */
    workspaceRootAsync(): Promise<string | null>;
    /** Install all current dependencies using the package manager */
    installAsync(): Promise<void>;
    /** Uninstall all current dependencies by removing the folder containing the packages */
    uninstallAsync(): Promise<void>;
    /** Add a normal dependency to the project */
    addAsync(namesOrFlags: string[]): Promise<void>;
    /** Add a development dependency to the project */
    addDevAsync(namesOrFlags: string[]): Promise<void>;
    /** Add a global dependency to the environment */
    addGlobalAsync(namesOrFlags: string[]): Promise<void>;
    /** Remove a normal dependency from the project */
    removeAsync(namesOrFlags: string[]): Promise<void>;
    /** Remove a development dependency from the project */
    removeDevAsync(namesOrFlags: string[]): Promise<void>;
    /** Remove a global dependency from the environments */
    removeGlobalAsync(namesOrFlags: string[]): Promise<void>;
}
