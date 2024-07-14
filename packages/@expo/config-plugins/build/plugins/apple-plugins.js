"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withXcodeProject = exports.withPodfileProperties = exports.withPodfile = exports.withInfoPlist = exports.withExpoPlist = exports.withEntitlementsPlist = exports.withAppDelegate = exports.createInfoPlistPluginWithPropertyGuard = exports.createInfoPlistPlugin = exports.createEntitlementsPlugin = void 0;
function _withMod() {
  const data = require("./withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
function _errors() {
  const data = require("../utils/errors");
  _errors = function () {
    return data;
  };
  return data;
}
function _obj() {
  const data = require("../utils/obj");
  _obj = function () {
    return data;
  };
  return data;
}
function _warnings() {
  const data = require("../utils/warnings");
  _warnings = function () {
    return data;
  };
  return data;
}
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
const createInfoPlistPlugin = applePlatform => (action, name) => {
  const withInfoPlistForPlatform = withInfoPlist(applePlatform);
  const withUnknown = config => withInfoPlistForPlatform(config, async config => {
    config.modResults = await action(config, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
};
exports.createInfoPlistPlugin = createInfoPlistPlugin;
const createInfoPlistPluginWithPropertyGuard = applePlatform => (action, settings, name) => {
  const withInfoPlistForPlatform = withInfoPlist(applePlatform);
  const withUnknown = config => withInfoPlistForPlatform(config, async config => {
    const existingProperty = settings.expoPropertyGetter ? settings.expoPropertyGetter(config) : (0, _obj().get)(config, settings.expoConfigProperty);
    // If the user explicitly sets a value in the infoPlist, we should respect that.
    if (config.modRawConfig[applePlatform]?.infoPlist?.[settings.infoPlistProperty] === undefined) {
      config.modResults = await action(config, config.modResults);
    } else if (existingProperty !== undefined) {
      // Only warn if there is a conflict.
      switch (applePlatform) {
        case 'ios':
          (0, _warnings().addWarningIOS)(settings.expoConfigProperty, `"${applePlatform}.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`);
          break;
        case 'macos':
          (0, _warnings().addWarningIOS)(settings.expoConfigProperty, `"${applePlatform}.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`);
          break;
        default:
          throw new (_errors().PluginError)(`Unsupported platform: ${applePlatform}`, 'UNSUPPORTED_PLATFORM');
      }
    }
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
};
exports.createInfoPlistPluginWithPropertyGuard = createInfoPlistPluginWithPropertyGuard;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
const createEntitlementsPlugin = applePlatform => (action, name) => {
  const withEntitlementsPlistForPlatform = withEntitlementsPlist(applePlatform);
  const withUnknown = config => withEntitlementsPlistForPlatform(config, async config => {
    config.modResults = await action(config, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name
    });
  }
  return withUnknown;
};

/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
exports.createEntitlementsPlugin = createEntitlementsPlugin;
const withAppDelegate = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'appDelegate',
    action
  });
};

/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.ios.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
exports.withAppDelegate = withAppDelegate;
const withInfoPlist = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'infoPlist',
    async action(config) {
      config = await action(config);
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform].infoPlist = config.modResults;
      return config;
    }
  });
};

/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.ios.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
exports.withInfoPlist = withInfoPlist;
const withEntitlementsPlist = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'entitlements',
    async action(config) {
      config = await action(config);
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform].entitlements = config.modResults;
      return config;
    }
  });
};

/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
exports.withEntitlementsPlist = withEntitlementsPlist;
const withExpoPlist = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'expoPlist',
    action
  });
};

/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
exports.withExpoPlist = withExpoPlist;
const withXcodeProject = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'xcodeproj',
    action
  });
};

/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
exports.withXcodeProject = withXcodeProject;
const withPodfile = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'podfile',
    action
  });
};

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
exports.withPodfile = withPodfile;
const withPodfileProperties = applePlatform => (config, action) => {
  return (0, _withMod().withMod)(config, {
    platform: applePlatform,
    mod: 'podfileProperties',
    action
  });
};
exports.withPodfileProperties = withPodfileProperties;
//# sourceMappingURL=apple-plugins.js.map