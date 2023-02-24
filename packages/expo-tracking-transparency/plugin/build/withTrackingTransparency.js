"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserTrackingPermission = exports.DEFAULT_NSUserTrackingUsageDescription = void 0;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-tracking-transparency/package.json');
exports.DEFAULT_NSUserTrackingUsageDescription = 'Allow this app to collect app-related data that can be used for tracking you or your device.';
const withTrackingTransparency = (config, props) => {
    config = (0, exports.withUserTrackingPermission)(config, props);
    return config;
};
const withUserTrackingPermission = (config, { userTrackingPermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSUserTrackingUsageDescription =
        userTrackingPermission ||
            config.ios.infoPlist.NSUserTrackingUsageDescription ||
            exports.DEFAULT_NSUserTrackingUsageDescription;
    return config;
};
exports.withUserTrackingPermission = withUserTrackingPermission;
exports.default = (0, config_plugins_1.createRunOncePlugin)(withTrackingTransparency, pkg.name, pkg.version);
