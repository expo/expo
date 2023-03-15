import { PackageJSONConfig } from '../Config.types';
/** @returns the absolute entry file for an Expo project. */
export declare function resolveEntryPoint(projectRoot: string, { platform, pkg, }?: {
    platform?: string;
    pkg?: PackageJSONConfig;
}): string;
export declare function getFileWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
