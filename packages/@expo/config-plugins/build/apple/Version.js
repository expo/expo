"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildNumber = void 0;
exports.getVersion = getVersion;
exports.setBuildNumber = void 0;
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
const withBuildNumber = applePlatform => (0, _applePlugins().createInfoPlistPluginWithPropertyGuard)(applePlatform)((config, infoPlist) => setBuildNumber(applePlatform)(config, infoPlist), {
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
const getBuildNumber = applePlatform => config => config[applePlatform]?.buildNumber ? config[applePlatform].buildNumber : '1';
exports.getBuildNumber = getBuildNumber;
const setBuildNumber = applePlatform => (config, infoPlist) => {
  return {
    ...infoPlist,
    CFBundleVersion: getBuildNumber(applePlatform)(config)
  };
};
exports.setBuildNumber = setBuildNumber;
//# sourceMappingURL=Version.js.map