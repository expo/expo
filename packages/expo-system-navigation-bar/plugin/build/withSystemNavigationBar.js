"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStrings = void 0;
const config_plugins_1 = require("@expo/config-plugins");
// @ts-ignore: uses flow
const normalize_color_1 = __importDefault(require("@react-native/normalize-color"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('expo:system-navigation-bar:plugin');
const pkg = require('expo-system-navigation-bar/package.json');
const BACKGROUND_COLOR_KEY = 'expo_system_navigation_bar_background_color';
const BORDER_COLOR_KEY = 'expo_system_navigation_bar_border_color';
const APPEARANCE_KEY = 'expo_system_navigation_bar_appearance';
const VISIBILITY_KEY = 'expo_system_navigation_bar_visibility';
const POSITION_KEY = 'expo_system_navigation_bar_position';
const BEHAVIOR_KEY = 'expo_system_navigation_bar_behavior';
const LEGACY_VISIBLE_KEY = 'expo_system_navigation_bar_legacy_visible';
const LEGACY_BAR_STYLE_MAP = {
    'light-content': 'light',
    'dark-content': 'dark',
};
function convertColor(input) {
    const color = normalize_color_1.default(input);
    if (!color) {
        throw new Error('Invalid color value: ' + input);
    }
    return ((color << 24) | (color >>> 8)) >>> 0;
}
const withSystemNavigationBar = (config, _props) => {
    var _a, _b, _c, _d;
    let props;
    if (!_props) {
        props = {
            backgroundColor: (_a = config.androidNavigationBar) === null || _a === void 0 ? void 0 : _a.backgroundColor,
            appearance: ((_b = config.androidNavigationBar) === null || _b === void 0 ? void 0 : _b.barStyle)
                ? LEGACY_BAR_STYLE_MAP[(_c = config.androidNavigationBar) === null || _c === void 0 ? void 0 : _c.barStyle]
                : undefined,
            // Resources for:
            // - sticky-immersive: https://youtu.be/cBi8fjv90E4?t=416 -- https://developer.android.com/training/system-ui/immersive#sticky-immersive
            // - immersive: https://youtu.be/cBi8fjv90E4?t=168 -- https://developer.android.com/training/system-ui/immersive#immersive
            // - leanback: https://developer.android.com/training/system-ui/immersive#leanback
            legacyVisible: (_d = config.androidNavigationBar) === null || _d === void 0 ? void 0 : _d.visible,
        };
        if (props.legacyVisible) {
            // TODO: Add an FYI that uses the new properties
            config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar', 'visible property is deprecated in Android 30', 'https://developer.android.com/reference/android/view/View.html#setSystemUiVisibility(int)');
        }
    }
    else {
        props = _props;
    }
    debug('Props:', props);
    // TODO: Add this to expo/config-plugins
    // Elevate props to a static value on extra so Expo Go can read it.
    if (!config.extra) {
        config.extra = {};
    }
    config.extra[pkg.name] = props;
    return config_plugins_1.withStringsXml(config, (config) => {
        config.modResults = setStrings(config.modResults, props);
        return config;
    });
};
function setStrings(strings, { backgroundColor, borderColor, appearance, visibility, position, behavior, legacyVisible }) {
    const pairs = [
        [BACKGROUND_COLOR_KEY, backgroundColor ? convertColor(backgroundColor) : null],
        [BORDER_COLOR_KEY, borderColor ? convertColor(borderColor) : null],
        [APPEARANCE_KEY, appearance],
        [VISIBILITY_KEY, visibility],
        [POSITION_KEY, position],
        [BEHAVIOR_KEY, behavior],
        [LEGACY_VISIBLE_KEY, legacyVisible],
    ].filter(([, value]) => !!value);
    const stringItems = pairs.map(([key, value]) => {
        return config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: key,
            value: String(value),
            translatable: false,
        });
    });
    return config_plugins_1.AndroidConfig.Strings.setStringItem(stringItems, strings);
}
exports.setStrings = setStrings;
exports.default = config_plugins_1.createRunOncePlugin(withSystemNavigationBar, pkg.name, pkg.version);
