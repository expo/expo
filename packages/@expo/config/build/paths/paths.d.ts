import { PackageJSONConfig } from '../Config.types';
export declare function ensureSlash(inputPath: string, needsSlash: boolean): string;
export declare function getPossibleProjectRoot(): string;
/** @returns the absolute entry file for an Expo project. */
export declare function resolveEntryPoint(projectRoot: string, { platform, pkg, }?: {
    platform?: string;
    pkg?: PackageJSONConfig;
}): string;
export declare function getFileWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
