"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppleAuthIOS = exports.withIOSMixedLocales = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Enable including `strings` files from external packages.
 * Required for making the Apple Auth button support localizations.
 *
 * @param config
 * @returns
 */
exports.withIOSMixedLocales = config => {
    return config_plugins_1.withInfoPlist(config, config => {
        var _a;
        config.modResults.CFBundleAllowMixedLocalizations = (_a = config.modResults.CFBundleAllowMixedLocalizations) !== null && _a !== void 0 ? _a : true;
        return config;
    });
};
exports.withAppleAuthIOS = config => {
    config = exports.withIOSMixedLocales(config);
    return config_plugins_1.withEntitlementsPlist(config, config => {
        config.modResults['com.apple.developer.applesignin'] = ['Default'];
        return config;
    });
};
