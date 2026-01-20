"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withNotificationError = exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _createLegacyPlugin() {
  const data = require("../createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
const withNotificationError = config => {
  return (0, _configPlugins().withDangerousMod)(config, ['android', async config => {
    if ('notification' in config) {
      throw new Error('The `notification` property in app config is no longer supported. Use the `expo-notifications` config plugin instead.');
    }
    return config;
  }]);
};
exports.withNotificationError = withNotificationError;
var _default = exports.default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-notifications',
  fallback: [
  // Android
  withNotificationError
  // iOS
  // Automatic setting of APNS entitlement is no longer needed
  ]
});
//# sourceMappingURL=expo-notifications.js.map