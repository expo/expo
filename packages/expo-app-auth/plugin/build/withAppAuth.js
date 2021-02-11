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
const withAppAuth = (config, { placeholder = config_plugins_1.AndroidConfig.Scheme.getScheme(config)[0] || 'dev.expo.app' } = {}) => {
    return config_plugins_1.withAppBuildGradle(config, config => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setGradlePlaceholders(config.modResults.contents, placeholder);
        }
        else {
            throw new Error("Cannot set manifest placeholders' appAuthRedirectScheme in the app gradle because the build.gradle is not groovy");
        }
        return config;
    });
};
exports.default = config_plugins_1.createRunOncePlugin(withAppAuth, pkg.name, pkg.version);
