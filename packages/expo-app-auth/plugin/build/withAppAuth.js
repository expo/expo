"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGradlePlaceholders = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-app-auth/package.json');
// The placeholder scheme doesn't really matter, but sometimes the Android build fails without it being defined.
function setGradlePlaceholders(buildGradle, placeholder) {
    const pattern = /appAuthRedirectScheme:\s?(["'])(?:(?=(\\?))\2.)*?\1/g;
    const replacement = `appAuthRedirectScheme: '${placeholder}'`;
    if (buildGradle.match(pattern)) {
        // Select kotlinVersion = '***' and replace the contents between the quotes.
        return buildGradle.replace(pattern, replacement);
    }
    // There's a chance this could fail if another plugin defines `manifestPlaceholders`
    // but AFAIK only app-auth does this in the Expo ecosystem.
    return buildGradle.replace(/defaultConfig\s?{/, `defaultConfig {
        manifestPlaceholders = [${replacement}]`);
}
exports.setGradlePlaceholders = setGradlePlaceholders;
const withAppAuthGradleManifestPlaceholder = (config, { placeholder = config_plugins_1.AndroidConfig.Scheme.getScheme(config)[0] || 'dev.expo.app' } = {}) => {
    return (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setGradlePlaceholders(config.modResults.contents, placeholder);
        }
        else {
            throw new Error("Cannot set manifest placeholders' appAuthRedirectScheme in the app gradle because the build.gradle is not groovy");
        }
        return config;
    });
};
const withAppAuthInfoPlist = (config, OAuthRedirect) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        var _a;
        if (!Array.isArray(config.modResults.CFBundleURLTypes)) {
            config.modResults.CFBundleURLTypes = [];
        }
        if (!((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier)) {
            config_plugins_1.WarningAggregator.addWarningIOS('expo-app-auth', 'ios.bundleIdentifier must be defined in app.json or app.config.js');
            return config;
        }
        config.modResults.CFBundleURLTypes.push({
            // @ts-ignore: not on type
            CFBundleTypeRole: 'Editor',
            CFBundleURLName: 'OAuthRedirect',
            CFBundleURLSchemes: [OAuthRedirect ? OAuthRedirect : config.ios.bundleIdentifier],
        });
        return config;
    });
};
const withAppAuth = (config, props) => {
    config = withAppAuthGradleManifestPlaceholder(config, props);
    config = withAppAuthInfoPlist(config);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withAppAuth, pkg.name, pkg.version);
