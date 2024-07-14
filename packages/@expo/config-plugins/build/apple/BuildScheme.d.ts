export declare function getSchemesFromXcodeproj(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
export declare function getRunnableSchemesFromXcodeproj(projectRoot: string, applePlatform: 'ios' | 'macos', { configuration }?: {
    configuration?: 'Debug' | 'Release';
}): {
    name: string;
    osType: string;
    type: string;
}[];
export declare function getApplicationTargetNameForSchemeAsync(projectRoot: string, applePlatform: 'ios' | 'macos', scheme: string): Promise<string>;
export declare function getArchiveBuildConfigurationForSchemeAsync(projectRoot: string, applePlatform: 'ios' | 'macos', scheme: string): Promise<string>;
