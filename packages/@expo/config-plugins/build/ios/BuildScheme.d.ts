export declare function getSchemesFromXcodeproj(projectRoot: string): string[];
export declare function getRunnableSchemesFromXcodeproj(projectRoot: string, { configuration }?: {
    configuration?: 'Debug' | 'Release';
}): {
    name: string;
    osType: string;
    type: string;
}[];
export declare function getApplicationTargetNameForSchemeAsync(projectRoot: string, scheme: string): Promise<string>;
export declare function getArchiveBuildConfigurationForSchemeAsync(projectRoot: string, scheme: string): Promise<string>;
