import { ModPlatform, StaticPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import {
  findModulesAsync,
  resolveSearchPathsAsync,
} from 'expo-modules-autolinking/build/autolinking';

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
  const searchPaths = await resolveSearchPathsAsync(null, projectRoot);

  const platformPaths = await Promise.all(
    platforms.map(platform =>
      findModulesAsync({
        platform,
        searchPaths,
        silent: true,
      })
    )
  );

  return resolvePackagesList(platformPaths);
}

export function resolvePackagesList(platformPaths: Record<string, any>[]) {
  const allPlatformPaths = platformPaths.map(paths => Object.keys(paths)).flat();

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
