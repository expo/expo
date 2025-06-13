import type { PackageJSONConfig } from '@expo/config';
import type { CustomResolver } from 'metro-resolver';

export type CustomPlatform = {
  /** The name of the platform used when resolving, e.g. macos, or windows */
  name: string;
  /** The React Native npm package name of the out-of-tree platform */
  package: string;
};

const KNOWN_CUSTOM_PLATFORMS: CustomPlatform[] = [
  { name: 'macos', package: 'react-native-macos' },
  { name: 'windows', package: 'react-native-windows' },
];

/**
 * Resolve all known out-of-tree platforms from the project's package json.
 * This also requires a list of platforms to resolve.
 */
export function resolveCustomPlatforms(
  packageFile: PackageJSONConfig,
  customPlatforms: true | CustomPlatform[]
) {
  const resolvedPlatforms: Record<string, string> = {};
  const customPlatformList = customPlatforms === true ? KNOWN_CUSTOM_PLATFORMS : customPlatforms;

  for (const knownPlatform of customPlatformList) {
    if (packageFile.dependencies?.[knownPlatform.package]) {
      resolvedPlatforms[knownPlatform.name] = knownPlatform.package;
    }
  }

  return Object.keys(resolvedPlatforms).length > 0 ? resolvedPlatforms : null;
}

/** Create a custom Metro resolver for OOT platforms, based on the resolved platforms */
export function createCustomPlatformResolver(
  platforms: ReturnType<typeof resolveCustomPlatforms>
): CustomResolver | undefined {
  if (!platforms) return undefined;

  return function customPlatformResolver(context, moduleName, platform) {
    // Only remap `react-native` imports for resolved OOT platforms
    if (platform && (moduleName === 'react-native' || moduleName.startsWith('react-native/'))) {
      const customPlatform = platforms[platform];
      if (customPlatform) {
        return context.resolveRequest(
          context,
          moduleName.replace('react-native', customPlatform),
          platform
        );
      }
    }

    // Fallback to normal resolution
    return context.resolveRequest(context, moduleName, platform);
  };
}
