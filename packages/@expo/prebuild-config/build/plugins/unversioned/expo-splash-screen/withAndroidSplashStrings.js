"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashStrings = exports.withAndroidSplashStrings = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';
const STATUS_BAR_TRANSLUCENT_KEY = 'expo_splash_screen_status_bar_translucent';
const withAndroidSplashStrings = (config) => {
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        const splashConfig = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(config);
        if (splashConfig) {
            const { resizeMode } = splashConfig;
            const statusBarTranslucent = !!config.androidStatusBar?.translucent;
            config.modResults = setSplashStrings(config.modResults, resizeMode, statusBarTranslucent);
        }
        return config;
    });
};
exports.withAndroidSplashStrings = withAndroidSplashStrings;
function setSplashStrings(strings, resizeMode, statusBarTranslucent) {
    return config_plugins_1.AndroidConfig.Strings.setStringItem([
        config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: RESIZE_MODE_KEY,
            value: resizeMode,
            translatable: false,
        }),
        config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: STATUS_BAR_TRANSLUCENT_KEY,
            value: String(statusBarTranslucent),
            translatable: false,
        }),
    ], strings);
}
exports.setSplashStrings = setSplashStrings;
