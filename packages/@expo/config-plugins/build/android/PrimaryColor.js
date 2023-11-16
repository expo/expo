"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrimaryColor = exports.withPrimaryColorStyles = exports.withPrimaryColorColors = exports.withPrimaryColor = void 0;
const Colors_1 = require("./Colors");
const Styles_1 = require("./Styles");
const android_plugins_1 = require("../plugins/android-plugins");
const COLOR_PRIMARY_KEY = 'colorPrimary';
const DEFAULT_PRIMARY_COLOR = '#023c69';
const withPrimaryColor = (config) => {
    config = (0, exports.withPrimaryColorColors)(config);
    config = (0, exports.withPrimaryColorStyles)(config);
    return config;
};
exports.withPrimaryColor = withPrimaryColor;
const withPrimaryColorColors = (config) => {
    return (0, android_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = (0, Colors_1.assignColorValue)(config.modResults, {
            name: COLOR_PRIMARY_KEY,
            value: getPrimaryColor(config),
        });
        return config;
    });
};
exports.withPrimaryColorColors = withPrimaryColorColors;
const withPrimaryColorStyles = (config) => {
    return (0, android_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = (0, Styles_1.assignStylesValue)(config.modResults, {
            add: !!getPrimaryColor(config),
            parent: (0, Styles_1.getAppThemeLightNoActionBarGroup)(),
            name: COLOR_PRIMARY_KEY,
            value: `@color/${COLOR_PRIMARY_KEY}`,
        });
        return config;
    });
};
exports.withPrimaryColorStyles = withPrimaryColorStyles;
function getPrimaryColor(config) {
    return config.primaryColor ?? DEFAULT_PRIMARY_COLOR;
}
exports.getPrimaryColor = getPrimaryColor;
