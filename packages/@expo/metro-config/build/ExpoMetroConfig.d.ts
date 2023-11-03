import { Reporter } from 'metro';
import { ConfigT as MetroConfig, InputConfigT } from 'metro-config';
import { INTERNAL_CALLSITES_REGEX } from './customizeFrame';
export interface LoadOptions {
    config?: string;
    maxWorkers?: number;
    port?: number;
    reporter?: Reporter;
    resetCache?: boolean;
}
export interface DefaultConfigOptions {
    /**
     * **Experimental:** Enable CSS support for Metro web, and shim on native.
     *
     * This is an experimental feature and may change in the future. The underlying implementation
     * is subject to change, and native support for CSS Modules may be added in the future during a non-major SDK release.
     */
    isCSSEnabled?: boolean;
    /** Set to `true` to add comments above each module with the file path. Defaults to `false` in production. */
    annotate?: boolean;
    /** @deprecated */
    mode?: 'exotic';
}
export declare function getDefaultConfig(projectRoot: string, { mode, isCSSEnabled, annotate }?: DefaultConfigOptions): InputConfigT;
export declare function loadAsync(projectRoot: string, { reporter, ...metroOptions }?: LoadOptions): Promise<MetroConfig>;
export { MetroConfig, INTERNAL_CALLSITES_REGEX };
export declare const EXPO_DEBUG: boolean;
