export declare const getSchemesFromXcodeproj: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
export declare const getRunnableSchemesFromXcodeproj: (applePlatform: 'ios' | 'macos') => (projectRoot: string, { configuration }?: {
    configuration?: "Release" | "Debug" | undefined;
}) => {
    name: string;
    osType: string;
    type: string;
}[];
export declare const getApplicationTargetNameForSchemeAsync: (applePlatform: 'ios' | 'macos') => (projectRoot: string, scheme: string) => Promise<string>;
export declare const getArchiveBuildConfigurationForSchemeAsync: (applePlatform: 'ios' | 'macos') => (projectRoot: string, scheme: string) => Promise<string>;
