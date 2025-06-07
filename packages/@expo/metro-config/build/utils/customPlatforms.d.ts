import type { PackageJSONConfig } from '@expo/config';
import type { CustomResolver } from 'metro-resolver';
export type CustomPlatform = {
    /** The name of the platform used when resolving, e.g. macos, or windows */
    name: string;
    /** The React Native npm package name of the out-of-tree platform */
    package: string;
};
/**
 * Resolve all known out-of-tree platforms from the project's package json.
 * This also requires a list of platforms to resolve.
 */
export declare function resolveCustomPlatforms(packageFile: PackageJSONConfig, customPlatforms: true | CustomPlatform[]): Record<string, string> | null;
/** Create a custom Metro resolver for OOT platforms, based on the resolved platforms */
export declare function createCustomPlatformResolver(platforms: ReturnType<typeof resolveCustomPlatforms>): CustomResolver | undefined;
