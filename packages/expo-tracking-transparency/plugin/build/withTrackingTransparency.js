"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-tracking-transparency/package.json');
const DEFAULT_NSUserTrackingUsageDescription = 'Allow this app to collect app-related data that can be used for tracking you or your device.';
const withTrackingTransparency = (config, props) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSUserTrackingUsageDescription =
            props?.userTrackingPermission ||
                config.modResults.NSUserTrackingUsageDescription ||
                DEFAULT_NSUserTrackingUsageDescription;
        return config;
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'com.google.android.gms.permission.AD_ID',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withTrackingTransparency, pkg.name, pkg.version);
