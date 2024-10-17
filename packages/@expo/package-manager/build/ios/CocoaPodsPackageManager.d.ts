import { SpawnOptions, SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { Ora } from 'ora';
export type CocoaPodsErrorCode = 'NON_INTERACTIVE' | 'NO_CLI' | 'COMMAND_FAILED';
export declare class CocoaPodsError extends Error {
    code: CocoaPodsErrorCode;
    cause?: Error | undefined;
    readonly name = "CocoaPodsError";
    readonly isPackageManagerError = true;
    constructor(message: string, code: CocoaPodsErrorCode, cause?: Error | undefined);
}
export declare function extractMissingDependencyError(errorOutput: string): [string, string] | null;
interface CocoaPodsPackageManagerProps {
    cwd: string;
    silent?: boolean;
    spawnOptions?: SpawnOptions;
    nonInteractive?: boolean;
}
export declare class CocoaPodsPackageManager {
    options: SpawnOptions;
    silent: boolean;
    private nonInteractive;
    static getPodProjectRoot(projectRoot: string): string | null;
    static isUsingPods(projectRoot: string): boolean;
    static isUsingRubyBundler(projectRoot: string): boolean;
    static create(projectRoot: string, props: CocoaPodsPackageManagerProps): CocoaPodsPackageManager;
    private gemInstallCLIAsync;
    private brewLinkCLIAsync;
    private brewInstallCLIAsync;
    installCLIAsync(): Promise<boolean>;
    static isAvailable(projectRoot: string, silent: boolean): boolean;
    isCLIInstalledAsync(spawnOptions?: SpawnOptions): Promise<boolean>;
    constructor({ cwd, silent, nonInteractive, spawnOptions }: CocoaPodsPackageManagerProps);
    get name(): string;
    /** Runs `pod install` and attempts to automatically run known troubleshooting steps automatically. */
    installAsync({ spinner }?: {
        spinner?: Ora;
    }): Promise<void>;
    private handleInstallErrorAsync;
    private _installAsync;
    private runInstallTypeCommandAsync;
    spawnPodCommandAsync(args?: readonly string[], options?: SpawnOptions): SpawnPromise<SpawnResult>;
    podCommandForDisplay(): string;
    addWithParametersAsync(names: string[], parameters: string[]): Promise<void>;
    addAsync(names?: string[]): void;
    addDevAsync(names?: string[]): void;
    addGlobalAsync(names?: string[]): void;
    removeAsync(names?: string[]): void;
    removeDevAsync(names?: string[]): void;
    removeGlobalAsync(names?: string[]): void;
    versionAsync(): Promise<string>;
    configAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    uninstallAsync(): Promise<void>;
    _runAsync(args: string[]): Promise<SpawnResult>;
}
export declare class CocoaPodsBundlerPackageManager extends CocoaPodsPackageManager {
    installCLIAsync(): Promise<boolean>;
    private rubyBundlerInstallCLIAsync;
    spawnPodCommandAsync(args?: readonly string[], options?: SpawnOptions): SpawnPromise<SpawnResult>;
    podCommandForDisplay(): string;
}
export declare function getPodUpdateMessage(output: string): {
    updatePackage: string | null;
    shouldUpdateRepo: boolean;
};
export declare function getPodRepoUpdateMessage(errorOutput: string): {
    updatePackage: string | null;
    shouldUpdateRepo: boolean;
    message: string;
};
/**
 * Format the CocoaPods CLI install error.
 *
 * @param error Error from CocoaPods CLI `pod install` command.
 * @returns
 */
export declare function getImprovedPodInstallError(error: SpawnResult & Error, { cwd }: Pick<SpawnOptions, 'cwd'>): Error;
export {};
