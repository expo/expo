"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBitcode = getBitcode;
exports.setBitcode = setBitcode;
exports.setBitcodeWithConfig = setBitcodeWithConfig;
exports.withCustomBitcode = exports.withBitcode = void 0;
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
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
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
    return data;
  };
  return data;
}
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
const withBitcode = config => {
  return (0, _iosPlugins().withXcodeProject)(config, async config => {
    config.modResults = await setBitcodeWithConfig(config, {
      project: config.modResults
    });
    return config;
  });
};

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
exports.withBitcode = withBitcode;
const withCustomBitcode = (config, bitcode) => {
  return (0, _iosPlugins().withXcodeProject)(config, async config => {
    config.modResults = await setBitcode(bitcode, {
      project: config.modResults
    });
    return config;
  });
};

/**
 * Get the bitcode preference from the Expo config.
 */
exports.withCustomBitcode = withCustomBitcode;
function getBitcode(config) {
  var _config$ios;
  return (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.bitcode;
}

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
function setBitcodeWithConfig(config, {
  project
}) {
  const bitcode = getBitcode(config);
  return setBitcode(bitcode, {
    project
  });
}

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
function setBitcode(bitcode, {
  project
}) {
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
      (0, _warnings().addWarningIOS)('ios.bitcode', `No configuration named "${targetName}". Expected one of: ${names.join(', ')}.`);
    }
  }
  project.addBuildProperty('ENABLE_BITCODE', isBitcodeEnabled ? 'YES' : 'NO', targetName);
  return project;
}
//# sourceMappingURL=Bitcode.js.map