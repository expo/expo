"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const resolve_from_1 = __importDefault(require("resolve-from"));
const createLegacyPlugin_1 = require("./createLegacyPlugin");
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';
// Copied from expo-location package, this gets used when the
// user has react-native-maps installed but not expo-location.
const withDefaultLocationPermissions = (config) => {
    const isLinked = !config._internal?.autolinkedModules ||
        config._internal.autolinkedModules.includes('react-native-maps');
    // Only add location permissions if react-native-maps is installed.
    if (config._internal?.projectRoot &&
        resolve_from_1.default.silent(config._internal.projectRoot, 'react-native-maps') &&
        isLinked) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            config.modResults.NSLocationWhenInUseUsageDescription =
                config.modResults.NSLocationWhenInUseUsageDescription || LOCATION_USAGE;
            return config;
        });
        return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.ACCESS_FINE_LOCATION',
        ]);
    }
    return config;
};
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'react-native-maps',
    fallback: [
        config_plugins_1.AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey,
        config_plugins_1.IOSConfig.Maps.withMaps,
        withDefaultLocationPermissions,
    ],
});
