"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserTrackingPermission = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-tracking-transparency/package.json');
const DEFAULT_NSUserTrackingUsageDescription = 'Allow this app to collect app-related data that can be used for tracking you or your device.';
const withTrackingTransparency = (config, props) => {
    config = exports.withUserTrackingPermission(config, props);
    return config;
};
exports.withUserTrackingPermission = (config, { userTrackingPermission } = {}) => {
    if (userTrackingPermission === false) {
        if (config && config.ios && config.ios.infoPlist) {
            delete config.ios.infoPlist.NSUserTrackingUsageDescription;
        }
        return config;
    }
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSUserTrackingUsageDescription =
        userTrackingPermission ||
            config.ios.infoPlist.NSUserTrackingUsageDescription ||
            DEFAULT_NSUserTrackingUsageDescription;
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withTrackingTransparency, pkg.name, pkg.version);
