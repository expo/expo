"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatDeviceFamilies = formatDeviceFamilies;
exports.withDeviceFamily = exports.setDeviceFamily = exports.getSupportsTablet = exports.getIsTabletOnly = exports.getDeviceFamilies = void 0;
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
const withDeviceFamily = applePlatform => config => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, async config => {
    config.modResults = await setDeviceFamily(applePlatform)(config, {
      project: config.modResults
    });
    return config;
  });
};
exports.withDeviceFamily = withDeviceFamily;
const getSupportsTablet = applePlatform => config => !!config[applePlatform]?.supportsTablet;
exports.getSupportsTablet = getSupportsTablet;
const getIsTabletOnly = applePlatform => config => !!config?.[applePlatform]?.isTabletOnly;
exports.getIsTabletOnly = getIsTabletOnly;
const getDeviceFamilies = applePlatform => config => {
  const supportsTablet = getSupportsTablet(applePlatform)(config);
  const isTabletOnly = getIsTabletOnly(applePlatform)(config);
  if (isTabletOnly && config[applePlatform]?.supportsTablet === false) {
    (0, _warnings().addWarningForPlatform)(applePlatform, `${applePlatform}.supportsTablet`, `Found contradictory values: \`{ ${applePlatform}: { isTabletOnly: true, supportsTablet: false } }\`. Using \`{ isTabletOnly: true }\`.`);
  }

  // 1 is iPhone, 2 is iPad
  if (isTabletOnly) {
    return [2];
  } else if (supportsTablet) {
    return [1, 2];
  } else {
    // is iPhone only
    return [1];
  }
};

/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
exports.getDeviceFamilies = getDeviceFamilies;
function formatDeviceFamilies(deviceFamilies) {
  return `"${deviceFamilies.join(',')}"`;
}

/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
const setDeviceFamily = applePlatform => (config, {
  project
}) => {
  const deviceFamilies = formatDeviceFamilies(getDeviceFamilies(applePlatform)(config));
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const {
    buildSettings
  } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      if (typeof buildSettings?.TVOS_DEPLOYMENT_TARGET !== 'undefined') {
        buildSettings.TARGETED_DEVICE_FAMILY = '3';
      } else {
        buildSettings.TARGETED_DEVICE_FAMILY = deviceFamilies;
      }
    }
  }
  return project;
};
exports.setDeviceFamily = setDeviceFamily;
//# sourceMappingURL=DeviceFamily.js.map