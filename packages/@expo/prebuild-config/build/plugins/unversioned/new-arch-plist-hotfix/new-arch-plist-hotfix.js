"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
// This is a temporary plugin to fix the plist hotfix for the new arch.
// Fixes: https://github.com/expo/expo/issues/39597
const withNewArchPlistHotfix = config => {
  return (0, _configPlugins().withInfoPlist)(config, config => {
    config.modResults = setNewArchPlistHotfixConfig(config, config.modResults);
    return config;
  });
};
function getNewArchEnabled(config) {
  const newArchEnabled = (config.ios?.newArchEnabled ?? config.newArchEnabled)?.toString();
  return newArchEnabled !== 'false';
}
function setNewArchPlistHotfixConfig(config, infoPlist) {
  const newArchEnabled = getNewArchEnabled(config);
  return {
    ...infoPlist,
    RCTNewArchEnabled: newArchEnabled
  };
}
var _default = exports.default = withNewArchPlistHotfix;
//# sourceMappingURL=new-arch-plist-hotfix.js.map