"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashColorsForTheme = exports.setSplashStylesForTheme = exports.getSplashDarkBackgroundColor = exports.getSplashBackgroundColor = exports.removeOldSplashStyleGroup = exports.withAndroidSplashStyles = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const android_1 = require("@expo/config-plugins/build/android");
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const styleResourceGroup = {
    name: 'Theme.App.SplashScreen',
    parent: 'AppTheme',
};
const SPLASH_COLOR_NAME = 'splashscreen_background';
const withAndroidSplashStyles = (config) => {
    config = (0, config_plugins_1.withAndroidColors)(config, (config) => {
        const backgroundColor = getSplashBackgroundColor(config);
        config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
        return config;
    });
    config = (0, config_plugins_1.withAndroidColorsNight)(config, (config) => {
        const backgroundColor = getSplashDarkBackgroundColor(config);
        config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
        return config;
    });
    config = (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = removeOldSplashStyleGroup(config.modResults);
        config.modResults = setSplashStylesForTheme(config.modResults);
        return config;
    });
    return config;
};
exports.withAndroidSplashStyles = withAndroidSplashStyles;
// Remove the old style group which didn't extend the base theme properly.
function removeOldSplashStyleGroup(styles) {
    const group = {
        name: 'Theme.App.SplashScreen',
        parent: 'Theme.AppCompat.Light.NoActionBar',
    };
    styles.resources.style = styles.resources.style?.filter?.(({ $: head }) => {
        let matches = head.name === group.name;
        if (group.parent != null && matches) {
            matches = head.parent === group.parent;
        }
        return !matches;
    });
    return styles;
}
exports.removeOldSplashStyleGroup = removeOldSplashStyleGroup;
function getSplashBackgroundColor(config) {
    return (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(config)?.backgroundColor ?? null;
}
exports.getSplashBackgroundColor = getSplashBackgroundColor;
function getSplashDarkBackgroundColor(config) {
    return (0, getAndroidSplashConfig_1.getAndroidDarkSplashConfig)(config)?.backgroundColor ?? null;
}
exports.getSplashDarkBackgroundColor = getSplashDarkBackgroundColor;
function setSplashStylesForTheme(styles) {
    // Add splash screen image
    return config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: true,
        value: '@drawable/splashscreen',
        name: 'android:windowBackground',
        parent: styleResourceGroup,
    });
}
exports.setSplashStylesForTheme = setSplashStylesForTheme;
function setSplashColorsForTheme(colors, backgroundColor) {
    return android_1.Colors.assignColorValue(colors, { value: backgroundColor, name: SPLASH_COLOR_NAME });
}
exports.setSplashColorsForTheme = setSplashColorsForTheme;
