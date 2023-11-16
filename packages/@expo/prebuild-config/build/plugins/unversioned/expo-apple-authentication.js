"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const createLegacyPlugin_1 = require("./createLegacyPlugin");
const withAppleSignInWarning = (config) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        if (config.ios?.usesAppleSignIn) {
            config_plugins_1.WarningAggregator.addWarningIOS('ios.usesAppleSignIn', 'Install expo-apple-authentication to enable this feature', 'https://docs.expo.dev/versions/latest/sdk/apple-authentication/#eas-build');
        }
        return config;
    });
};
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-apple-authentication',
    fallback: withAppleSignInWarning,
});
