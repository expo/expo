import { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { RushConfiguration } from '@rushstack/rush-sdk';
import { PackageManagerOptions } from '../PackageManager';
import { BasePackageManager } from './BasePackageManager';
export declare class RushPackageManager extends BasePackageManager {
    readonly name = "rush";
    readonly bin = "node";
    readonly lockFile: string;
    readonly rushConfiguration: RushConfiguration;
    constructor(options?: PackageManagerOptions);
    runAsync(command: string[]): SpawnPromise<SpawnResult>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    workspaceRoot(): RushPackageManager;
    installAsync(namesOrFlags?: string[]): SpawnPromise<SpawnResult>;
    uninstallAsync(): Promise<void>;
    addAsync(namesOrFlags?: string[]): SpawnPromise<SpawnResult>;
    addDevAsync(namesOrFlags?: string[]): SpawnPromise<SpawnResult>;
    addGlobalAsync(): SpawnPromise<SpawnResult>;
    removeAsync(namesOrFlags?: string[]): SpawnPromise<SpawnResult>;
    removeDevAsync(namesOrFlags?: string[]): SpawnPromise<SpawnResult>;
    removeGlobalAsync(): SpawnPromise<SpawnResult>;
    private runRush;
}
