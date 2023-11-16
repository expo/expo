"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserInterfaceStyle = exports.getUserInterfaceStyle = exports.withIosUserInterfaceStyle = void 0;
const ios_plugins_1 = require("@expo/config-plugins/build/plugins/ios-plugins");
exports.withIosUserInterfaceStyle = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setUserInterfaceStyle, {
    infoPlistProperty: 'UIUserInterfaceStyle',
    expoConfigProperty: 'userInterfaceStyle | ios.userInterfaceStyle',
    expoPropertyGetter: getUserInterfaceStyle,
}, 'withIosUserInterfaceStyle');
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
