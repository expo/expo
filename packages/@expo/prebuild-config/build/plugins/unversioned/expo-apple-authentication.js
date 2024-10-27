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
function _createLegacyPlugin() {
  const data = require("./createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
const withAppleSignInWarning = config => {
  return (0, _configPlugins().withEntitlementsPlist)(config, config => {
    if (config.ios?.usesAppleSignIn) {
      _configPlugins().WarningAggregator.addWarningIOS('ios.usesAppleSignIn', 'Install expo-apple-authentication to enable this feature', 'https://docs.expo.dev/versions/latest/sdk/apple-authentication/#eas-build');
    }
    return config;
  });
};
var _default = exports.default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-apple-authentication',
  fallback: withAppleSignInWarning
});
//# sourceMappingURL=expo-apple-authentication.js.map