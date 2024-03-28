"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _withAndroidNotifications() {
  const data = require("./withAndroidNotifications");
  _withAndroidNotifications = function () {
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
var _default = exports.default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-notifications',
  fallback: [
  // Android
  _withAndroidNotifications().withNotificationManifest, _withAndroidNotifications().withNotificationIconColor, _withAndroidNotifications().withNotificationIcons
  // iOS
  // Automatic setting of APNS entitlement is no longer needed
  ]
});
//# sourceMappingURL=expo-notifications.js.map