"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAutolinkedPackagesAsync = getAutolinkedPackagesAsync;
exports.resolvePackagesList = resolvePackagesList;
exports.shouldSkipAutoPlugin = shouldSkipAutoPlugin;
function _unstableAutolinkingExports() {
  const data = require("expo/internal/unstable-autolinking-exports");
  _unstableAutolinkingExports = function () {
    return data;
  };
  return data;
}
/**
 * Returns a list of packages that are autolinked to a project.
 *
 * @param projectRoot
 * @param platforms platforms to check for
 * @returns list of packages ex: `['expo-camera', 'react-native-screens']`
 */
async function getAutolinkedPackagesAsync(projectRoot, platforms = ['ios', 'android']) {
  const linker = (0, _unstableAutolinkingExports().makeCachedDependenciesLinker)({
    projectRoot
  });
  const dependenciesPerPlatform = await Promise.all(platforms.map(platform => {
    return (0, _unstableAutolinkingExports().scanExpoModuleResolutionsForPlatform)(linker, platform);
  }));
  return resolvePackagesList(dependenciesPerPlatform);
}
function resolvePackagesList(platformPaths) {
  const allPlatformPaths = platformPaths.map(paths => Object.keys(paths)).flat();
  const uniquePaths = [...new Set(allPlatformPaths)];
  return uniquePaths.sort();
}
function shouldSkipAutoPlugin(config, plugin) {
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
      const isIncluded = config._internal.autolinkedModules.includes(pluginId);
      if (!isIncluded) {
        // If it doesn't then we know that any potential plugin shouldn't be applied automatically.
        return true;
      }
    }
  }
  return false;
}
//# sourceMappingURL=getAutolinkedPackages.js.map