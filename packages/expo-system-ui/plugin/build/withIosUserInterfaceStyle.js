"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserInterfaceStyle = exports.getUserInterfaceStyle = exports.withIosUserInterfaceStyle = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withIosUserInterfaceStyle = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setUserInterfaceStyle(config, config.modResults);
        return config;
    });
};
exports.withIosUserInterfaceStyle = withIosUserInterfaceStyle;
function getUserInterfaceStyle(config) {
    return config.ios?.userInterfaceStyle ?? config.userInterfaceStyle ?? 'light';
}
exports.getUserInterfaceStyle = getUserInterfaceStyle;
function setUserInterfaceStyle(config, { UIUserInterfaceStyle, ...infoPlist }) {
    const userInterfaceStyle = getUserInterfaceStyle(config);
    const style = mapUserInterfaceStyleForInfoPlist(userInterfaceStyle);
    if (!style) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        UIUserInterfaceStyle: style,
    };
}
exports.setUserInterfaceStyle = setUserInterfaceStyle;
function mapUserInterfaceStyleForInfoPlist(userInterfaceStyle) {
    switch (userInterfaceStyle) {
        case 'light':
            return 'Light';
        case 'dark':
            return 'Dark';
        case 'automatic':
            return 'Automatic';
    }
    return null;
}
