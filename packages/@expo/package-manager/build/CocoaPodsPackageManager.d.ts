import { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import { Ora } from 'ora';
import { PackageManager } from './PackageManager';
export type CocoaPodsErrorCode = 'NON_INTERACTIVE' | 'NO_CLI' | 'COMMAND_FAILED';
export declare class CocoaPodsError extends Error {
    code: CocoaPodsErrorCode;
    cause?: Error | undefined;
    readonly name = "CocoaPodsError";
    readonly isPackageManagerError = true;
    constructor(message: string, code: CocoaPodsErrorCode, cause?: Error | undefined);
}
export declare function extractMissingDependencyError(errorOutput: string): [string, string] | null;
export declare class CocoaPodsPackageManager implements PackageManager {
    options: SpawnOptions;
    private silent;
    static getPodProjectRoot(projectRoot: string): string | null;
    static isUsingPods(projectRoot: string): boolean;
    static gemInstallCLIAsync(nonInteractive?: boolean, spawnOptions?: SpawnOptions): Promise<void>;
    static brewLinkCLIAsync(spawnOptions?: SpawnOptions): Promise<void>;
    static brewInstallCLIAsync(spawnOptions?: SpawnOptions): Promise<void>;
    static installCLIAsync({ nonInteractive, spawnOptions, }: {
        nonInteractive?: boolean;
        spawnOptions?: SpawnOptions;
    }): Promise<boolean>;
    static isAvailable(projectRoot: string, silent: boolean): boolean;
    static isCLIInstalledAsync(spawnOptions?: SpawnOptions): Promise<boolean>;
    constructor({ cwd, silent }: {
        cwd: string;
        silent?: boolean;
    });
    get name(): string;
    /** Runs `pod install` and attempts to automatically run known troubleshooting steps automatically. */
    installAsync({ spinner }?: {
        spinner?: Ora;
    }): Promise<void>;
    isCLIInstalledAsync(): Promise<boolean>;
    installCLIAsync(): Promise<boolean>;
    handleInstallErrorAsync({ error, shouldUpdate, updatedPackages, spinner, }: {
        error: any;
        spinner?: Ora;
        shouldUpdate?: boolean;
        updatedPackages?: string[];
    }): Promise<SpawnResult>;
    private _installAsync;
    private runInstallTypeCommandAsync;
    addWithParametersAsync(names: string[], parameters: string[]): Promise<void>;
    addAsync(...names: string[]): Promise<void>;
    addDevAsync(...names: string[]): Promise<void>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    cleanAsync(): Promise<void>;
    private podRepoUpdateAsync;
    _runAsync(args: string[]): Promise<SpawnResult>;
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
