"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavigationBarStyle = exports.getNavigationBarColor = exports.getNavigationBarImmersiveMode = exports.setNavigationBarStyles = exports.setNavigationBarColors = exports.withNavigationBar = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const NAVIGATION_BAR_COLOR = 'navigationBarColor';
const withNavigationBar = (config) => {
    const immersiveMode = getNavigationBarImmersiveMode(config);
    if (immersiveMode) {
        // Immersive mode needs to be set programmatically
        config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.visible', 'Property is deprecated in Android 11 (API 30) and will be removed from Expo SDK.', 'https://expo.fyi/android-navigation-bar-visible-deprecated');
    }
    config = withNavigationBarColors(config);
    config = withNavigationBarStyles(config);
    return config;
};
exports.withNavigationBar = withNavigationBar;
const withNavigationBarColors = (config) => {
    return (0, config_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = setNavigationBarColors(config, config.modResults);
        return config;
    });
};
const withNavigationBarStyles = (config) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = setNavigationBarStyles(config, config.modResults);
        return config;
    });
};
function setNavigationBarColors(config, colors) {
    const hexString = getNavigationBarColor(config);
    if (hexString) {
        colors = config_plugins_1.AndroidConfig.Colors.setColorItem(config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: NAVIGATION_BAR_COLOR,
            value: hexString,
        }), colors);
    }
    return colors;
}
exports.setNavigationBarColors = setNavigationBarColors;
function setNavigationBarStyles(config, styles) {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: getNavigationBarStyle(config) === 'dark-content',
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
        name: 'android:windowLightNavigationBar',
        value: 'true',
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: !!getNavigationBarColor(config),
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
        name: `android:${NAVIGATION_BAR_COLOR}`,
        value: `@color/${NAVIGATION_BAR_COLOR}`,
    });
    return styles;
}
exports.setNavigationBarStyles = setNavigationBarStyles;
function getNavigationBarImmersiveMode(config) {
    return config.androidNavigationBar?.visible || null;
}
exports.getNavigationBarImmersiveMode = getNavigationBarImmersiveMode;
function getNavigationBarColor(config) {
    return config.androidNavigationBar?.backgroundColor || null;
}
exports.getNavigationBarColor = getNavigationBarColor;
function getNavigationBarStyle(config) {
    return config.androidNavigationBar?.barStyle || 'light-content';
}
exports.getNavigationBarStyle = getNavigationBarStyle;
