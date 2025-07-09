"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
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
const withLocation = (config, { locationAlwaysAndWhenInUsePermission, locationAlwaysPermission, locationWhenInUsePermission, isIosBackgroundLocationEnabled, isAndroidBackgroundLocationEnabled, isAndroidForegroundServiceEnabled, } = {}) => {
    if (isIosBackgroundLocationEnabled) {
        config = withBackgroundLocation(config);
    }
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSLocationAlwaysAndWhenInUseUsageDescription: LOCATION_USAGE,
        NSLocationAlwaysUsageDescription: LOCATION_USAGE,
        NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
    })(config, {
        NSLocationAlwaysAndWhenInUseUsageDescription: locationAlwaysAndWhenInUsePermission,
        NSLocationAlwaysUsageDescription: locationAlwaysPermission,
        NSLocationWhenInUseUsageDescription: locationWhenInUsePermission,
    });
    // If the user has not specified a value for isAndroidForegroundServiceEnabled,
    // we default to the value of isAndroidBackgroundLocationEnabled because we want
    // to enable foreground by default if background location is enabled.
    const enableAndroidForegroundService = typeof isAndroidForegroundServiceEnabled === 'undefined'
        ? isAndroidBackgroundLocationEnabled
        : isAndroidForegroundServiceEnabled;
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        // Note: these are already added in the library AndroidManifest.xml and so
        // are not required here, we may want to remove them in the future.
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        // These permissions are optional, and not listed in the library AndroidManifest.xml
        isAndroidBackgroundLocationEnabled && 'android.permission.ACCESS_BACKGROUND_LOCATION',
        enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE',
        enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE_LOCATION',
    ].filter(Boolean));
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withLocation, pkg.name, pkg.version);
