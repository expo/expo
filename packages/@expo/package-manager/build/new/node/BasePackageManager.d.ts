import { PackageManager, PackageManagerOptions } from '../PackageManager';
export declare abstract class BasePackageManager implements PackageManager {
    readonly silent: boolean;
    readonly logger: (...args: any) => void;
    readonly options: PackageManagerOptions;
    constructor({ silent, logger, ...options }?: PackageManagerOptions);
    /** Get the name of the package manager */
    abstract readonly name: string;
    /** Get the executable binary of the package manager */
    abstract readonly bin: string;
    /** Get the lockfile for this package manager */
    abstract readonly lockFile: string;
    abstract addAsync(namesOrFlags: string[]): Promise<void>;
    abstract addDevAsync(namesOrFlags: string[]): Promise<void>;
    abstract addGlobalAsync(namesOrFlags: string[]): Promise<void>;
    abstract removeAsync(namesOrFlags: string[]): Promise<void>;
    abstract removeDevAsync(namesOrFlags: string[]): Promise<void>;
    abstract removeGlobalAsync(namesOrFlags: string[]): Promise<void>;
    /** Ensure the CWD is set to a non-empty string */
    protected ensureCwdDefined(method?: string): string;
    runAsync(command: string[]): import("@expo/spawn-async").SpawnPromise<import("@expo/spawn-async").SpawnResult>;
    versionAsync(): Promise<string>;
    configAsync(key: string): Promise<string>;
    workspaceRootAsync(): Promise<string | null>;
    removeLockFileAsync(): Promise<void>;
    installAsync(flags?: string[]): Promise<void>;
    uninstallAsync(): Promise<void>;
}
