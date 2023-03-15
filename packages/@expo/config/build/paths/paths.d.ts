import { PackageJSONConfig } from '../Config.types';
export declare function resolveEntryPoint(projectRoot: string, { platform, pkg }: {
    platform: string;
    pkg?: PackageJSONConfig;
}): string;
export declare function getEntryPointWithExtensions(projectRoot: string, { extensions, pkg, }: {
    extensions: string[];
    pkg?: PackageJSONConfig;
}): string;
export declare function getFileWithExtensions(fromDirectory: string, moduleId: string, extensions: string[]): string | null;
