"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosUserInterfaceStyle = void 0;
exports.getUserInterfaceStyle = getUserInterfaceStyle;
exports.setUserInterfaceStyle = setUserInterfaceStyle;
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
