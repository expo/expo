"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatDeviceFamilies = formatDeviceFamilies;
exports.getDeviceFamilies = getDeviceFamilies;
exports.getIsTabletOnly = getIsTabletOnly;
exports.getSupportsTablet = getSupportsTablet;
exports.setDeviceFamily = setDeviceFamily;
exports.withDeviceFamily = void 0;
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
const withDeviceFamily = config => {
  return (0, _iosPlugins().withXcodeProject)(config, async config => {
    config.modResults = await setDeviceFamily(config, {
      project: config.modResults
    });
    return config;
  });
};
exports.withDeviceFamily = withDeviceFamily;
function getSupportsTablet(config) {
  return !!config.ios?.supportsTablet;
}
function getIsTabletOnly(config) {
  return !!config?.ios?.isTabletOnly;
}
function getDeviceFamilies(config) {
  const supportsTablet = getSupportsTablet(config);
  const isTabletOnly = getIsTabletOnly(config);
  if (isTabletOnly && config.ios?.supportsTablet === false) {
    (0, _warnings().addWarningIOS)('ios.supportsTablet', `Found contradictory values: \`{ ios: { isTabletOnly: true, supportsTablet: false } }\`. Using \`{ isTabletOnly: true }\`.`);
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
}

/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
function formatDeviceFamilies(deviceFamilies) {
  return `"${deviceFamilies.join(',')}"`;
}

/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
function setDeviceFamily(config, {
  project
}) {
  const deviceFamilies = formatDeviceFamilies(getDeviceFamilies(config));
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
}
//# sourceMappingURL=DeviceFamily.js.map