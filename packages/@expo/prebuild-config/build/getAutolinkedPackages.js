"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAutolinkedPackagesAsync = getAutolinkedPackagesAsync;
exports.resolvePackagesList = resolvePackagesList;
exports.shouldSkipAutoPlugin = shouldSkipAutoPlugin;

function _autolinking() {
  const data = require("expo-modules-autolinking/build/autolinking");

  _autolinking = function () {
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
  const searchPaths = await (0, _autolinking().resolveSearchPathsAsync)(null, projectRoot);
  const platformPaths = await Promise.all(platforms.map(platform => (0, _autolinking().findModulesAsync)({
    platform,
    searchPaths,
    silent: true
  })));
  return resolvePackagesList(platformPaths);
}

function resolvePackagesList(platformPaths) {
  const allPlatformPaths = platformPaths.map(paths => Object.keys(paths)).flat();
  const uniquePaths = [...new Set(allPlatformPaths)];
  return uniquePaths.sort();
}

function shouldSkipAutoPlugin(config, plugin) {
  var _config$_internal;

  // Hack workaround because expo-dev-client doesn't use expo modules.
  if (plugin === 'expo-dev-client') {
    return false;
  } // Only perform the check if `autolinkedModules` is defined, otherwise we assume
  // this is a legacy runner which doesn't support autolinking.


  if (Array.isArray((_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : _config$_internal.autolinkedModules)) {
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