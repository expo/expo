"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-location/package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';
const withBackgroundLocation = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('location')) {
            config.modResults.UIBackgroundModes.push('location');
        }
        return config;
    });
};
const withLocation = (config, { locationAlwaysAndWhenInUsePermission, locationAlwaysPermission, locationWhenInUsePermission, isIosBackgroundLocationEnabled, isAndroidBackgroundLocationEnabled, } = {}) => {
    if (isIosBackgroundLocationEnabled) {
        config = withBackgroundLocation(config);
    }
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription =
            locationAlwaysAndWhenInUsePermission ||
                config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription ||
                LOCATION_USAGE;
        config.modResults.NSLocationAlwaysUsageDescription =
            locationAlwaysPermission ||
                config.modResults.NSLocationAlwaysUsageDescription ||
                LOCATION_USAGE;
        config.modResults.NSLocationWhenInUseUsageDescription =
            locationWhenInUsePermission ||
                config.modResults.NSLocationWhenInUseUsageDescription ||
                LOCATION_USAGE;
        return config;
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        // Optional
        isAndroidBackgroundLocationEnabled && 'android.permission.ACCESS_BACKGROUND_LOCATION',
    ].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withLocation, pkg.name, pkg.version);
