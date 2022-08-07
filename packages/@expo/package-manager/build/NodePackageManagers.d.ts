import { SpawnOptions } from '@expo/spawn-async';
import { Logger, PackageManager } from './PackageManager';
import { PnpmPackageManager } from './PnpmPackageManager';
export declare type NodePackageManager = 'yarn' | 'npm' | 'pnpm';
/**
 * Disable various postinstall scripts
 * - https://github.com/opencollective/opencollective-postinstall/pull/9
 */
export declare const DISABLE_ADS_ENV: {
    DISABLE_OPENCOLLECTIVE: string;
    ADBLOCK: string;
};
export declare class NpmPackageManager implements PackageManager {
    options: SpawnOptions;
    private log;
    constructor({ cwd, log, silent }: {
        cwd: string;
        log?: Logger;
        silent?: boolean;
    });
    get name(): string;
    installAsync(parameters?: string[]): Promise<void>;
    addGlobalAsync(...names: string[]): Promise<void>;
    addWithParametersAsync(names: string[], parameters?: string[]): Promise<void>;
    addAsync(...names: string[]): Promise<void>;
    addDevAsync(...names: string[]): Promise<void>;
    removeAsync(...names: string[]): Promise<void>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    cleanAsync(): Promise<void>;
    private _runAsync;
    private _parseSpecs;
    private _patchAsync;
}
export declare class YarnPackageManager implements PackageManager {
    options: SpawnOptions;
    private log;
    constructor({ cwd, log, silent }: {
        cwd: string;
        log?: Logger;
        silent?: boolean;
    });
    get name(): string;
    private withOfflineSupportAsync;
    installAsync(): Promise<void>;
    addGlobalAsync(...names: string[]): Promise<void>;
    addWithParametersAsync(names: string[], parameters?: string[]): Promise<void>;
    addAsync(...names: string[]): Promise<void>;
    addDevAsync(...names: string[]): Promise<void>;
    removeAsync(...names: string[]): Promise<void>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    cleanAsync(): Promise<void>;
    private _runAsync;
}
export declare type CreateForProjectOptions = Partial<Record<NodePackageManager, boolean>> & {
    log?: Logger;
    silent?: boolean;
};
export declare function createForProject(projectRoot: string, options?: CreateForProjectOptions): NpmPackageManager | YarnPackageManager | PnpmPackageManager;
export declare function getModulesPath(projectRoot: string): string;
