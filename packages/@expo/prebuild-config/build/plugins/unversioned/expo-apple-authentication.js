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
    var _config$ios;

    if ((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.usesAppleSignIn) {
      _configPlugins().WarningAggregator.addWarningIOS('ios.usesAppleSignIn', 'Install expo-apple-authentication to enable this feature', 'https://docs.expo.dev/versions/latest/sdk/apple-authentication/#eas-build');
    }

    return config;
  });
};

var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-apple-authentication',
  fallback: withAppleSignInWarning
});

exports.default = _default;
//# sourceMappingURL=expo-apple-authentication.js.map