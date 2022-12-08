/// <reference types="node" />
/// <reference types="node" />
import { SpawnOptions } from '@expo/spawn-async';
import { Transform } from 'stream';
import { Logger } from './PackageManager';
/** Exposed for testing */
export declare class PnpmStdoutTransform extends Transform {
    private isPeerDepsWarning;
    _transform(chunk: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void;
}
export declare class PnpmPackageManager {
    options: SpawnOptions;
    private log;
    constructor({ cwd, log, silent }: {
        cwd: string;
        log?: Logger;
        silent?: boolean;
    });
    get name(): string;
    installAsync(): Promise<void>;
    addWithParametersAsync(names: string[], parameters: string[]): Promise<void>;
    addAsync(...names: string[]): Promise<void>;
    addDevAsync(...names: string[]): Promise<void>;
    addGlobalAsync(...names: string[]): Promise<void>;
    removeAsync(...names: string[]): Promise<void>;
    versionAsync(): Promise<string>;
    getConfigAsync(key: string): Promise<string>;
    removeLockfileAsync(): Promise<void>;
    cleanAsync(): Promise<void>;
    private _runAsync;
}
