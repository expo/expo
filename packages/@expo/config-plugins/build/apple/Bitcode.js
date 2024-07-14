"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withCustomBitcode = exports.withBitcode = exports.setBitcodeWithConfig = exports.setBitcode = exports.getBitcode = void 0;
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
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
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` or `macos.bitcode` value.
 */
const withBitcode = applePlatform => config => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, async config => {
    config.modResults = await setBitcodeWithConfig(applePlatform)(config, {
      project: config.modResults
    });
    return config;
  });
};

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode` or `macos.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
exports.withBitcode = withBitcode;
const withCustomBitcode = applePlatform => (config, bitcode) => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, async config => {
    config.modResults = await setBitcode(applePlatform)(bitcode, {
      project: config.modResults
    });
    return config;
  });
};

/**
 * Get the bitcode preference from the Expo config.
 */
exports.withCustomBitcode = withCustomBitcode;
const getBitcode = applePlatform => config => config[applePlatform]?.bitcode;

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
exports.getBitcode = getBitcode;
const setBitcodeWithConfig = applePlatform => (config, {
  project
}) => {
  const bitcode = getBitcode(applePlatform)(config);
  return setBitcode(applePlatform)(bitcode, {
    project
  });
};

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
exports.setBitcodeWithConfig = setBitcodeWithConfig;
const setBitcode = applePlatform => (bitcode, {
  project
}) => {
  const isDefaultBehavior = bitcode == null;
  // If the value is undefined, then do nothing.
  if (isDefaultBehavior) {
    return project;
  }
  const targetName = typeof bitcode === 'string' ? bitcode : undefined;
  const isBitcodeEnabled = !!bitcode;
  if (targetName) {
    // Assert if missing
    const configs = Object.entries(project.pbxXCBuildConfigurationSection()).filter(_Xcodeproj().isNotComment);
    const hasConfiguration = configs.find(([, configuration]) => configuration.name === targetName);
    if (hasConfiguration) {
      // If targetName is defined then disable bitcode everywhere.
      project.addBuildProperty('ENABLE_BITCODE', 'NO');
    } else {
      const names = [
      // Remove duplicates, wrap in double quotes, and sort alphabetically.
      ...new Set(configs.map(([, configuration]) => `"${configuration.name}"`))].sort();
      (0, _warnings().addWarningForPlatform)(applePlatform, `${applePlatform}.bitcode`, `No configuration named "${targetName}". Expected one of: ${names.join(', ')}.`);
    }
  }
  project.addBuildProperty('ENABLE_BITCODE', isBitcodeEnabled ? 'YES' : 'NO', targetName);
  return project;
};
exports.setBitcode = setBitcode;
//# sourceMappingURL=Bitcode.js.map