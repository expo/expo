"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-background-fetch/package.json');
const withBackgroundFetch = (config) => {
    // TODO: Maybe entitlements are needed
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('fetch')) {
            config.modResults.UIBackgroundModes.push('fetch');
        }
        return config;
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.WAKE_LOCK',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBackgroundFetch, pkg.name, pkg.version);
