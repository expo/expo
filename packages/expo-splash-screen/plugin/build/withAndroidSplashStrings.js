"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashStrings = void 0;
exports.setSplashStrings = setSplashStrings;
const config_plugins_1 = require("expo/config-plugins");
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';
const withAndroidSplashStrings = (config, props) => {
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        const { resizeMode } = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(props);
        config.modResults = setSplashStrings(config.modResults, resizeMode);
        return config;
    });
};
exports.withAndroidSplashStrings = withAndroidSplashStrings;
function setSplashStrings(strings, resizeMode) {
    return config_plugins_1.AndroidConfig.Strings.setStringItem([
        config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: RESIZE_MODE_KEY,
            value: resizeMode,
            translatable: false,
        }),
    ], strings);
}
