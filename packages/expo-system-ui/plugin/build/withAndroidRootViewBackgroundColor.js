"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootViewBackgroundColor = exports.withRootViewBackgroundColorStyles = exports.withRootViewBackgroundColorColors = exports.withAndroidRootViewBackgroundColor = void 0;
const config_plugins_1 = require("expo/config-plugins");
const { assignColorValue } = config_plugins_1.AndroidConfig.Colors;
const { assignStylesValue, getAppThemeLightNoActionBarGroup } = config_plugins_1.AndroidConfig.Styles;
const ANDROID_WINDOW_BACKGROUND = 'android:windowBackground';
const WINDOW_BACKGROUND_COLOR = 'activityBackground';
const withAndroidRootViewBackgroundColor = (config) => {
    config = (0, exports.withRootViewBackgroundColorColors)(config);
    config = (0, exports.withRootViewBackgroundColorStyles)(config);
    return config;
};
exports.withAndroidRootViewBackgroundColor = withAndroidRootViewBackgroundColor;
const withRootViewBackgroundColorColors = (config) => {
    return (0, config_plugins_1.withAndroidColors)(config, async (config) => {
        config.modResults = assignColorValue(config.modResults, {
            value: getRootViewBackgroundColor(config),
            name: WINDOW_BACKGROUND_COLOR,
        });
        return config;
    });
};
exports.withRootViewBackgroundColorColors = withRootViewBackgroundColorColors;
const withRootViewBackgroundColorStyles = (config) => {
    return (0, config_plugins_1.withAndroidStyles)(config, async (config) => {
        config.modResults = assignStylesValue(config.modResults, {
            add: !!getRootViewBackgroundColor(config),
            parent: getAppThemeLightNoActionBarGroup(),
            name: ANDROID_WINDOW_BACKGROUND,
            value: `@color/${WINDOW_BACKGROUND_COLOR}`,
        });
        return config;
    });
};
exports.withRootViewBackgroundColorStyles = withRootViewBackgroundColorStyles;
function getRootViewBackgroundColor(config) {
    return config.android?.backgroundColor || config.backgroundColor || null;
}
exports.getRootViewBackgroundColor = getRootViewBackgroundColor;
