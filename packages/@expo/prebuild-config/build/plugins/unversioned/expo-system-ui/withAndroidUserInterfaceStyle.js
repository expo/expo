"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidUserInterfaceStyle = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidUserInterfaceStyle = (config) => {
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        const userInterfaceStyle = config.android?.userInterfaceStyle ?? config.userInterfaceStyle;
        if (userInterfaceStyle) {
            config_plugins_1.WarningAggregator.addWarningAndroid('userInterfaceStyle', 
            // TODO: Maybe warn that they need a certain version of React Native as well?
            'Install expo-system-ui in your project to enable this feature.');
        }
        return config;
    });
};
exports.withAndroidUserInterfaceStyle = withAndroidUserInterfaceStyle;
