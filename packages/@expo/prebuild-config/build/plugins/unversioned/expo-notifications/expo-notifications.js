"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidNotifications_1 = require("./withAndroidNotifications");
const createLegacyPlugin_1 = require("../createLegacyPlugin");
const withNotificationsEntitlement = (config, mode) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        config.modResults['aps-environment'] = mode;
        return config;
    });
};
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-notifications',
    fallback: [
        // Android
        withAndroidNotifications_1.withNotificationManifest,
        withAndroidNotifications_1.withNotificationIconColor,
        withAndroidNotifications_1.withNotificationIcons,
        // iOS
        [withNotificationsEntitlement, 'development'],
    ],
});
