import { ProjectConfig } from '../Config.types';
export declare function ensureSlash(inputPath: string, needsSlash: boolean): string;
export declare function getPossibleProjectRoot(): string;
export declare function resolveEntryPoint(projectRoot: string, { platform, projectConfig }: {
    platform: string;
    projectConfig?: ProjectConfig;
}): string | null;
export declare function getEntryPoint(projectRoot: string, entryFiles: string[], platforms: string[], projectConfig?: ProjectConfig): string | null;
export declare function getEntryPointWithExtensions(projectRoot: string, entryFiles: string[], extensions: string[], projectConfig?: ProjectConfig): string;
export declare function resolveFromSilentWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
export declare function getFileWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
