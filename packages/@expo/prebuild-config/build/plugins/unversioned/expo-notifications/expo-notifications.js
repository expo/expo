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
  const data = require("../createLegacyPlugin");

  _createLegacyPlugin = function () {
    return data;
  };

  return data;
}

function _withAndroidNotifications() {
  const data = require("./withAndroidNotifications");

  _withAndroidNotifications = function () {
    return data;
  };

  return data;
}

const withNotificationsEntitlement = (config, mode) => {
  return (0, _configPlugins().withEntitlementsPlist)(config, config => {
    config.modResults['aps-environment'] = mode;
    return config;
  });
};

var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-notifications',
  fallback: [// Android
  _withAndroidNotifications().withNotificationManifest, _withAndroidNotifications().withNotificationIconColor, _withAndroidNotifications().withNotificationIcons, // iOS
  [withNotificationsEntitlement, 'development']]
});

exports.default = _default;
//# sourceMappingURL=expo-notifications.js.map