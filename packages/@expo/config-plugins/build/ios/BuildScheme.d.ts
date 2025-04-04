import { ModPlatform } from '../Plugin.types';
export declare function getSchemesFromXcodeproj(projectRoot: string, platform: ModPlatform): string[];
export declare function getRunnableSchemesFromXcodeproj(projectRoot: string, platform: ModPlatform, { configuration }?: {
    configuration?: 'Debug' | 'Release';
}): {
    name: string;
    osType: string;
    type: string;
}[];
export declare function getApplicationTargetNameForSchemeAsync(projectRoot: string, platform: ModPlatform, scheme: string): Promise<string>;
export declare function getArchiveBuildConfigurationForSchemeAsync(projectRoot: string, platform: ModPlatform, scheme: string): Promise<string>;
