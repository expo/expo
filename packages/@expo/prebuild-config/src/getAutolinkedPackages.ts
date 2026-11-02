import type { ModPlatform, StaticPlugin } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';
import resolveFrom from 'resolve-from';

/**
 * Returns a list of packages that are autolinked to a project.
 *
 * @param projectRoot
 * @param platforms platforms to check for
 * @returns list of packages ex: `['expo-camera', 'react-native-screens']`
 */
export async function getAutolinkedPackagesAsync(
  projectRoot: string,
  platforms: ModPlatform[] = ['ios', 'android']
) {
  const { makeCachedDependenciesLinker, scanExpoModuleResolutionsForPlatform } =
    importAutolinkingExportsFromProject(projectRoot);
  const linker = makeCachedDependenciesLinker({ projectRoot });
  const dependenciesPerPlatform = await Promise.all(
    platforms.map((platform) => {
      return scanExpoModuleResolutionsForPlatform(linker, platform);
    })
  );
  return resolvePackagesList(dependenciesPerPlatform);
}

/**
 * Loads autolinking through the project's `expo` package, so we use the same
 * `expo-modules-autolinking` version that `expo` pins instead of our own copy.
 */
function importAutolinkingExportsFromProject(
  projectRoot: string
): typeof import('expo-modules-autolinking/exports') {
  const autolinkingExportsPath = resolveFrom.silent(
    projectRoot,
    'expo/internal/unstable-autolinking-exports'
  );
  if (!autolinkingExportsPath) {
    throw new Error(
      `Cannot resolve "expo/internal/unstable-autolinking-exports" from "${projectRoot}". Make sure the "expo" package is installed.`
    );
  }
  return require(autolinkingExportsPath);
}

export function resolvePackagesList(platformPaths: Record<string, any>[]) {
  const allPlatformPaths = platformPaths.map((paths) => Object.keys(paths)).flat();

  const uniquePaths = [...new Set(allPlatformPaths)];

  return uniquePaths.sort();
}

export function shouldSkipAutoPlugin(
  config: Pick<ExpoConfig, '_internal'>,
  plugin: StaticPlugin | string
) {
  // Hack workaround because expo-dev-client doesn't use expo modules.
  if (plugin === 'expo-dev-client') {
    return false;
  }

  // Only perform the check if `autolinkedModules` is defined, otherwise we assume
  // this is a legacy runner which doesn't support autolinking.
  if (Array.isArray(config._internal?.autolinkedModules)) {
    // Resolve the pluginId as a string.
    const pluginId = Array.isArray(plugin) ? plugin[0] : plugin;
    if (typeof pluginId === 'string') {
      // Determine if the autolinked modules list includes our moduleId
      const isIncluded = config._internal!.autolinkedModules.includes(pluginId);
      if (!isIncluded) {
        // If it doesn't then we know that any potential plugin shouldn't be applied automatically.
        return true;
      }
    }
  }
  return false;
}
