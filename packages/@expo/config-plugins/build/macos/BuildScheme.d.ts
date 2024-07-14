export declare const getSchemesFromXcodeproj: (projectRoot: string) => string[];
export declare const getRunnableSchemesFromXcodeproj: (projectRoot: string, { configuration }?: {
    configuration?: "Release" | "Debug" | undefined;
}) => {
    name: string;
    osType: string;
    type: string;
}[];
export declare const getApplicationTargetNameForSchemeAsync: (projectRoot: string, scheme: string) => Promise<string>;
export declare const getArchiveBuildConfigurationForSchemeAsync: (projectRoot: string, scheme: string) => Promise<string>;
