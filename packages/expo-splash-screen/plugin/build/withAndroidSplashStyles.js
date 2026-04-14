"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashStyles = void 0;
exports.removeOldSplashStyleGroup = removeOldSplashStyleGroup;
exports.setSplashStylesForTheme = setSplashStylesForTheme;
exports.setSplashColorsForTheme = setSplashColorsForTheme;
const config_plugins_1 = require("expo/config-plugins");
const styleResourceGroup = {
    name: 'Theme.App.SplashScreen',
    parent: 'Theme.SplashScreen',
};
const SPLASH_COLOR_NAME = 'splashscreen_background';
const withAndroidSplashStyles = (config, splash) => {
    config = (0, config_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = setSplashColorsForTheme(config.modResults, splash.backgroundColor);
        return config;
    });
    config = (0, config_plugins_1.withAndroidColorsNight)(config, (config) => {
        const backgroundColor = splash.dark?.backgroundColor;
        if (!backgroundColor) {
            return config;
        }
        config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
        return config;
    });
    config = (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = removeOldSplashStyleGroup(config.modResults);
        config.modResults = addSplashScreenStyle(config.modResults);
        return config;
    });
    return config;
};
exports.withAndroidSplashStyles = withAndroidSplashStyles;
// Add the style that extends Theme.SplashScreen
function addSplashScreenStyle(styles) {
    const { resources } = styles;
    const { style = [] } = resources;
    const item = [
        {
            $: { name: 'windowSplashScreenBackground' },
            _: '@color/splashscreen_background',
        },
        {
            $: { name: 'windowSplashScreenAnimatedIcon' },
            _: '@drawable/splashscreen_logo',
        },
        {
            $: { name: 'postSplashScreenTheme' },
            _: '@style/AppTheme',
        },
        {
            $: { name: 'android:windowSplashScreenBehavior' },
            _: 'icon_preferred',
        },
    ];
    styles.resources.style = [
        ...style.filter(({ $ }) => $.name !== 'Theme.App.SplashScreen'),
        {
            $: {
                ...styleResourceGroup,
                parent: 'Theme.SplashScreen',
            },
            item,
        },
    ];
    return styles;
}
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
function setSplashStylesForTheme(styles) {
    // Add splash screen image
    return config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: true,
        value: '@drawable/splashscreen_logo',
        name: 'android:windowSplashScreenBackground',
        parent: styleResourceGroup,
    });
}
function setSplashColorsForTheme(colors, backgroundColor) {
    return config_plugins_1.AndroidConfig.Colors.assignColorValue(colors, {
        value: backgroundColor,
        name: SPLASH_COLOR_NAME,
    });
}
