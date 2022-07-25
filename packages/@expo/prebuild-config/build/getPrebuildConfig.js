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
  return getPrebuildConfig(projectRoot, { ...props,
    autolinkedModules
  });
}

function getPrebuildConfig(projectRoot, {
  platforms,
  bundleIdentifier,
  packageName,
  autolinkedModules,
  expoUsername
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

  const resolvedExpoUsername = typeof expoUsername === 'function' ? expoUsername(config) : // If the user didn't pass a username then fallback on the static cached username.
  expoUsername !== null && expoUsername !== void 0 ? expoUsername : (0, _config().getAccountUsername)(config); // Add all built-in plugins first because they should take
  // priority over the unversioned plugins.

  config = (0, _withDefaultPlugins().withVersionedExpoSDKPlugins)(config, {
    expoUsername: resolvedExpoUsername
  });
  config = (0, _withDefaultPlugins().withLegacyExpoPlugins)(config);

  if (platforms.includes('ios')) {
    var _ref;

    if (!config.ios) config.ios = {};
    config.ios.bundleIdentifier = (_ref = bundleIdentifier !== null && bundleIdentifier !== void 0 ? bundleIdentifier : config.ios.bundleIdentifier) !== null && _ref !== void 0 ? _ref : `com.placeholder.appid`; // Add all built-in plugins

    config = (0, _withDefaultPlugins().withIosExpoPlugins)(config, {
      bundleIdentifier: config.ios.bundleIdentifier
    });
  }

  if (platforms.includes('android')) {
    var _ref2;

    if (!config.android) config.android = {};
    config.android.package = (_ref2 = packageName !== null && packageName !== void 0 ? packageName : config.android.package) !== null && _ref2 !== void 0 ? _ref2 : `com.placeholder.appid`; // Add all built-in plugins

    config = (0, _withDefaultPlugins().withAndroidExpoPlugins)(config, {
      package: config.android.package
    });
  }

  return {
    exp: config,
    ...rest
  };
}
//# sourceMappingURL=getPrebuildConfig.js.map