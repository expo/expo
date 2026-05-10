import type { PluginItem } from './babel-core';
interface LoadBabelConfigResult {
    exts?: string;
    presets?: PluginItem[];
}
export declare function resolveBabelrcName(projectRoot: string): string | undefined;
/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
export declare const loadBabelConfig: (options: {
    projectRoot: string;
    enableBabelRCLookup?: boolean | undefined;
    extendsBabelConfigPath?: string | undefined;
}) => LoadBabelConfigResult;
export {};
