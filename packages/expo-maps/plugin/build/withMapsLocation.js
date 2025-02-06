"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-maps/package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';
const withMapsLocation = (config, { requestLocationPermission, locationPermission } = {}) => {
    // Don't add the permissions if requestLocationPermission is not set explicity
    if (!requestLocationPermission) {
        return config;
    }
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
    })(config, {
        NSLocationWhenInUseUsageDescription: locationPermission,
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMapsLocation, pkg.name, pkg.version);
