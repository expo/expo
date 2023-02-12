"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildNumber = getBuildNumber;
exports.getVersion = getVersion;
exports.setBuildNumber = setBuildNumber;
exports.setVersion = setVersion;
exports.withVersion = exports.withBuildNumber = void 0;
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
const withVersion = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setVersion, {
  infoPlistProperty: 'CFBundleShortVersionString',
  expoConfigProperty: 'version'
}, 'withVersion');
exports.withVersion = withVersion;
const withBuildNumber = (0, _iosPlugins().createInfoPlistPluginWithPropertyGuard)(setBuildNumber, {
  infoPlistProperty: 'CFBundleVersion',
  expoConfigProperty: 'ios.buildNumber'
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
function getBuildNumber(config) {
  var _config$ios;
  return (_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.buildNumber ? config.ios.buildNumber : '1';
}
function setBuildNumber(config, infoPlist) {
  return {
    ...infoPlist,
    CFBundleVersion: getBuildNumber(config)
  };
}
//# sourceMappingURL=Version.js.map