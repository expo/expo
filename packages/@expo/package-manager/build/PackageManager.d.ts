import { SpawnOptions } from '@expo/spawn-async';
export declare type Logger = (...args: any[]) => void;
export interface PackageManager {
    installAsync(): Promise<void>;
    addWithParametersAsync(names: string[], parameters: string[]): Promise<void>;
    addAsync(...names: string[]): Promise<void>;
    addDevAsync(...names: string[]): Promise<void>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    cleanAsync(): Promise<void>;
}
export declare function getPossibleProjectRoot(): string;
export declare function spawnSudoAsync(command: string[], spawnOptions: SpawnOptions): Promise<void>;
