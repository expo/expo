"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusBarStyle = exports.getStatusBarTranslucent = exports.getStatusBarColor = exports.setStatusBarStyles = exports.setStatusBarColors = exports.withStatusBar = void 0;
const assert_1 = __importDefault(require("assert"));
const Colors_1 = require("./Colors");
const Styles_1 = require("./Styles");
const android_plugins_1 = require("../plugins/android-plugins");
// https://developer.android.com/reference/android/R.attr#colorPrimaryDark
const COLOR_PRIMARY_DARK_KEY = 'colorPrimaryDark';
// https://developer.android.com/reference/android/R.attr#windowTranslucentStatus
const WINDOW_TRANSLUCENT_STATUS = 'android:windowTranslucentStatus';
// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';
const withStatusBar = (config) => {
    config = withStatusBarColors(config);
    config = withStatusBarStyles(config);
    return config;
};
exports.withStatusBar = withStatusBar;
const withStatusBarColors = (config) => {
    return (0, android_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = setStatusBarColors(config, config.modResults);
        return config;
    });
};
const withStatusBarStyles = (config) => {
    return (0, android_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = setStatusBarStyles(config, config.modResults);
        return config;
    });
};
function setStatusBarColors(config, colors) {
    return (0, Colors_1.assignColorValue)(colors, {
        name: COLOR_PRIMARY_DARK_KEY,
        value: getStatusBarColor(config),
    });
}
exports.setStatusBarColors = setStatusBarColors;
function setStatusBarStyles(config, styles) {
    const hexString = getStatusBarColor(config);
    const floatElement = getStatusBarTranslucent(config);
    styles = (0, Styles_1.assignStylesValue)(styles, {
        parent: (0, Styles_1.getAppThemeLightNoActionBarGroup)(),
        name: WINDOW_LIGHT_STATUS_BAR,
        targetApi: '23',
        value: 'true',
        // Default is light-content, don't need to do anything to set it
        add: getStatusBarStyle(config) === 'dark-content',
    });
    styles = (0, Styles_1.assignStylesValue)(styles, {
        parent: (0, Styles_1.getAppThemeLightNoActionBarGroup)(),
        name: WINDOW_TRANSLUCENT_STATUS,
        value: 'true',
        // translucent status bar set in theme
        add: floatElement,
    });
    styles = (0, Styles_1.assignStylesValue)(styles, {
        parent: (0, Styles_1.getAppThemeLightNoActionBarGroup)(),
        name: COLOR_PRIMARY_DARK_KEY,
        value: `@color/${COLOR_PRIMARY_DARK_KEY}`,
        // Remove the color if translucent is used
        add: !!hexString,
    });
    return styles;
}
exports.setStatusBarStyles = setStatusBarStyles;
function getStatusBarColor(config) {
    const backgroundColor = config.androidStatusBar?.backgroundColor;
    if (backgroundColor) {
        // Drop support for translucent
        (0, assert_1.default)(backgroundColor !== 'translucent', `androidStatusBar.backgroundColor must be a valid hex string, instead got: "${backgroundColor}"`);
    }
    return backgroundColor;
}
exports.getStatusBarColor = getStatusBarColor;
/**
 * Specifies whether the status bar should be "translucent". When true, the status bar is drawn with `position: absolute` and a gray underlay, when false `position: relative` (pushes content down).
 *
 * @default false
 * @param config
 * @returns
 */
function getStatusBarTranslucent(config) {
    return config.androidStatusBar?.translucent ?? false;
}
exports.getStatusBarTranslucent = getStatusBarTranslucent;
function getStatusBarStyle(config) {
    return config.androidStatusBar?.barStyle || 'light-content';
}
exports.getStatusBarStyle = getStatusBarStyle;
