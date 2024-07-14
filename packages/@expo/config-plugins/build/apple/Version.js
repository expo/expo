"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildNumber = getBuildNumber;
exports.getVersion = getVersion;
exports.setBuildNumber = setBuildNumber;
exports.setVersion = setVersion;
exports.withVersion = exports.withBuildNumber = void 0;
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
const withVersion = applePlatform => (0, _applePlugins().createInfoPlistPluginWithPropertyGuard)(applePlatform)(setVersion, {
  infoPlistProperty: 'CFBundleShortVersionString',
  expoConfigProperty: 'version'
}, 'withVersion');
exports.withVersion = withVersion;
const withBuildNumber = applePlatform => (0, _applePlugins().createInfoPlistPluginWithPropertyGuard)(applePlatform)((config, infoPlist) => setBuildNumber(applePlatform, config, infoPlist), {
  infoPlistProperty: 'CFBundleVersion',
  expoConfigProperty: `${applePlatform}.buildNumber`
}, 'withBuildNumber');
exports.withBuildNumber = withBuildNumber;
function getVersion(config) {
  return config.version || '1.0.0';
}
function setVersion(config, infoPlist) {
  return {
    ...infoPlist,
    CFBundleShortVersionString: getVersion(config)
  };
}
function getBuildNumber(applePlatform, config) {
  return config[applePlatform]?.buildNumber ? config[applePlatform].buildNumber : '1';
}
function setBuildNumber(applePlatform, config, infoPlist) {
  return {
    ...infoPlist,
    CFBundleVersion: getBuildNumber(applePlatform, config)
  };
}
//# sourceMappingURL=Version.js.map