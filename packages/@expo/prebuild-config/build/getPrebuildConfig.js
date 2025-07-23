"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPrebuildConfigAsync = getPrebuildConfigAsync;
function _config() {
  const data = require("@expo/config");
  _config = function () {
    return data;
  };
  return data;
}
function _getAutolinkedPackages() {
  const data = require("./getAutolinkedPackages");
  _getAutolinkedPackages = function () {
    return data;
  };
  return data;
}
function _withDefaultPlugins() {
  const data = require("./plugins/withDefaultPlugins");
  _withDefaultPlugins = function () {
    return data;
  };
  return data;
}
async function getPrebuildConfigAsync(projectRoot, props) {
  const autolinkedModules = await (0, _getAutolinkedPackages().getAutolinkedPackagesAsync)(projectRoot, props.platforms);
  return getPrebuildConfig(projectRoot, {
    ...props,
    autolinkedModules
  });
}
function getPrebuildConfig(projectRoot, {
  platforms,
  bundleIdentifier,
  packageName,
  autolinkedModules
}) {
  // let config: ExpoConfig;
  let {
    exp: config,
    ...rest
  } = (0, _config().getConfig)(projectRoot, {
    skipSDKVersionRequirement: true,
    isModdedConfig: true
  });
  if (autolinkedModules) {
    if (!config._internal) {
      config._internal = {};
    }
    config._internal.autolinkedModules = autolinkedModules;
  }

  // Add all built-in plugins first because they should take
  // priority over the unversioned plugins.
  config = (0, _withDefaultPlugins().withVersionedExpoSDKPlugins)(config);
  config = (0, _withDefaultPlugins().withLegacyExpoPlugins)(config);
  if (platforms.includes('ios')) {
    if (!config.ios) config.ios = {};
    config.ios.bundleIdentifier = bundleIdentifier ?? config.ios.bundleIdentifier ?? `com.placeholder.appid`;

    // Add all built-in plugins
    config = (0, _withDefaultPlugins().withIosExpoPlugins)(config, {
      bundleIdentifier: config.ios.bundleIdentifier
    });
  }
  if (platforms.includes('android')) {
    if (!config.android) config.android = {};
    config.android.package = packageName ?? config.android.package ?? `com.placeholder.appid`;

    // Add all built-in plugins
    config = (0, _withDefaultPlugins().withAndroidExpoPlugins)(config, {
      package: config.android.package,
      projectRoot
    });
  }
  return {
    exp: config,
    ...rest
  };
}
//# sourceMappingURL=getPrebuildConfig.js.map