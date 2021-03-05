"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-background-fetch/package.json');
const withBackgroundFetch = config => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    if (!config.ios.infoPlist.UIBackgroundModes)
        config.ios.infoPlist.UIBackgroundModes = [];
    // TODO: Maybe entitlements are needed
    config.ios.infoPlist.UIBackgroundModes = [
        ...new Set(config.ios.infoPlist.UIBackgroundModes.concat(['location', 'fetch'])),
    ];
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.WAKE_LOCK',
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withBackgroundFetch, pkg.name, pkg.version);
