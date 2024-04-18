"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidUserInterfaceStyle = void 0;
exports.resolveProps = resolveProps;
exports.setStrings = setStrings;
const assert_1 = __importDefault(require("assert"));
const config_plugins_1 = require("expo/config-plugins");
// strings.xml keys, this should not change.
const USER_INTERFACE_STYLE_KEY = 'expo_system_ui_user_interface_style';
const withAndroidUserInterfaceStyle = (config) => {
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = setStrings(config.modResults, resolveProps(config));
        return config;
    });
};
exports.withAndroidUserInterfaceStyle = withAndroidUserInterfaceStyle;
function resolveProps(config) {
    const userInterfaceStyle = config.android?.userInterfaceStyle ?? config.userInterfaceStyle;
    (0, assert_1.default)(!userInterfaceStyle || ['automatic', 'light', 'dark'].includes(userInterfaceStyle), `expo-system-ui: Invalid userInterfaceStyle: "${userInterfaceStyle}"`);
    return { userInterfaceStyle };
}
function setStrings(strings, { userInterfaceStyle }) {
    const pairs = [[USER_INTERFACE_STYLE_KEY, userInterfaceStyle]];
    const stringItems = [];
    for (const [key, value] of pairs) {
        if (value == null) {
            // Since we're using custom strings, we can remove them for convenience between prebuilds.
            strings = config_plugins_1.AndroidConfig.Strings.removeStringItem(key, strings);
        }
        else {
            stringItems.push(config_plugins_1.AndroidConfig.Resources.buildResourceItem({
                name: key,
                value: String(value),
                translatable: false,
            }));
        }
    }
    return config_plugins_1.AndroidConfig.Strings.setStringItem(stringItems, strings);
}
