import { Reporter } from 'metro';
import type MetroConfig from 'metro-config';
export declare const EXPO_DEBUG: boolean;
export declare const INTERNAL_CALLSITES_REGEX: RegExp;
export interface DefaultConfigOptions {
    mode?: 'exotic';
}
export declare function getDefaultConfig(projectRoot: string, options?: DefaultConfigOptions): MetroConfig.InputConfigT;
export interface LoadOptions {
    config?: string;
    maxWorkers?: number;
    port?: number;
    reporter?: Reporter;
    resetCache?: boolean;
}
export declare function loadAsync(projectRoot: string, { reporter, ...metroOptions }?: LoadOptions): Promise<MetroConfig.ConfigT>;
