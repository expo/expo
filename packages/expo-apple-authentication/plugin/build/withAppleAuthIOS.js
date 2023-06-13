"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppleAuthIOS = exports.withIOSMixedLocales = void 0;
const config_plugins_1 = require("expo/config-plugins");
/**
 * Enable including `strings` files from external packages.
 * Required for making the Apple Auth button support localizations.
 *
 * @param config
 * @returns
 */
const withIOSMixedLocales = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.CFBundleAllowMixedLocalizations =
            config.modResults.CFBundleAllowMixedLocalizations ?? true;
        return config;
    });
};
exports.withIOSMixedLocales = withIOSMixedLocales;
const withAppleAuthIOS = (config) => {
    config = (0, exports.withIOSMixedLocales)(config);
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        config.modResults['com.apple.developer.applesignin'] = ['Default'];
        return config;
    });
};
exports.withAppleAuthIOS = withAppleAuthIOS;
