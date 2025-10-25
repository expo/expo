import { PackageJSONConfig } from '../Config.types';
export declare function ensureSlash(inputPath: string, needsSlash: boolean): string;
export declare function getPossibleProjectRoot(): string;
/** @returns the absolute entry file for an Expo project. */
export declare function resolveEntryPoint(projectRoot: string, { platform, pkg, }?: {
    platform?: string;
    pkg?: PackageJSONConfig;
}): string;
export declare function getFileWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
/** Get the Metro server root, when working in monorepos */
export declare function getMetroServerRoot(projectRoot: string): string;
/**
 * Get the workspace globs for Metro's watchFolders.
 * @note This does not traverse the monorepo, and should be used with `getMetroServerRoot`
 */
export declare function getMetroWorkspaceGlobs(monorepoRoot: string): string[] | null;
