"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidNavigationBarExpoGoManifest = void 0;
exports.resolveProps = resolveProps;
exports.setStrings = setStrings;
exports.setNavigationBarColors = setNavigationBarColors;
exports.setNavigationBarStyles = setNavigationBarStyles;
// @ts-ignore: uses flow
const normalize_colors_1 = __importDefault(require("@react-native/normalize-colors"));
// @ts-ignore
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const debug = (0, debug_1.default)('expo:system-navigation-bar:plugin');
const pkg = require('expo-navigation-bar/package.json');
// strings.xml keys, this should not change.
const BORDER_COLOR_KEY = 'expo_navigation_bar_border_color';
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
const POSITION_KEY = 'expo_navigation_bar_position';
const BEHAVIOR_KEY = 'expo_navigation_bar_behavior';
const LEGACY_VISIBLE_KEY = 'expo_navigation_bar_legacy_visible';
// styles.xml value
const NAVIGATION_BAR_COLOR = 'navigationBarColor';
const LEGACY_BAR_STYLE_MAP = {
    // Match expo-status-bar
    'dark-content': 'dark',
    'light-content': 'light',
};
function convertColorAndroid(input) {
    let color = (0, normalize_colors_1.default)(input);
    if (!color) {
        throw new Error('Invalid color value: ' + input);
    }
    color = ((color << 24) | (color >>> 8)) >>> 0;
    // Android use 32 bit *signed* integer to represent the color
    // We utilize the fact that bitwise operations in JS also operates on
    // signed 32 bit integers, so that we can use those to convert from
    // *unsigned* to *signed* 32bit int that way.
    return color | 0x0;
}
function resolveProps(config, _props) {
    let props;
    if (!_props) {
        props = {
            backgroundColor: config.androidNavigationBar?.backgroundColor,
            barStyle: config.androidNavigationBar?.barStyle
                ? LEGACY_BAR_STYLE_MAP[config.androidNavigationBar?.barStyle]
                : undefined,
            // Resources for:
            // - sticky-immersive: https://youtu.be/cBi8fjv90E4?t=416 -- https://developer.android.com/training/system-ui/immersive#sticky-immersive
            // - immersive: https://youtu.be/cBi8fjv90E4?t=168 -- https://developer.android.com/training/system-ui/immersive#immersive
            // - leanback: https://developer.android.com/training/system-ui/immersive#leanback
            legacyVisible: config.androidNavigationBar?.visible,
        };
        if (props.legacyVisible) {
            // Using legacyVisible can break the setPositionAsync method:
            // https://developer.android.com/reference/androidx/core/view/WindowCompat#setDecorFitsSystemWindows(android.view.Window,%20boolean)
            config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.visible', 'property is deprecated in Android 11 (API 30) and will be removed from Expo SDK', 'https://expo.fyi/android-navigation-bar-visible-deprecated');
        }
    }
    else {
        props = _props;
    }
    return props;
}
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
const withAndroidNavigationBarExpoGoManifest = (config, props) => {
    if (!config.androidNavigationBar) {
        // Remap the config plugin props so Expo Go knows how to apply them.
        config.androidNavigationBar = {
            backgroundColor: props.backgroundColor ?? undefined,
            barStyle: Object.entries(LEGACY_BAR_STYLE_MAP).find(([, v]) => v === props.barStyle)?.[0],
            visible: props.legacyVisible,
        };
    }
    return config;
};
exports.withAndroidNavigationBarExpoGoManifest = withAndroidNavigationBarExpoGoManifest;
const withNavigationBar = (config, _props) => {
    const props = resolveProps(config, _props);
    config = (0, exports.withAndroidNavigationBarExpoGoManifest)(config, props);
    debug('Props:', props);
    // TODO: Add this to expo/config-plugins
    // Elevate props to a static value on extra so Expo Go can read it.
    if (!config.extra) {
        config.extra = {};
    }
    config.extra[pkg.name] = props;
    // Use built-in styles instead of Expo custom properties, this makes the project hopefully a bit more predictable for bare users.
    config = withNavigationBarColors(config, props);
    config = withNavigationBarStyles(config, props);
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = setStrings(config.modResults, props);
        return config;
    });
};
function setStrings(strings, { borderColor, visibility, position, behavior, legacyVisible, }) {
    const pairs = [
        [BORDER_COLOR_KEY, borderColor ? convertColorAndroid(borderColor) : null],
        [VISIBILITY_KEY, visibility],
        [POSITION_KEY, position],
        [BEHAVIOR_KEY, behavior],
        [LEGACY_VISIBLE_KEY, legacyVisible],
    ];
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
const withNavigationBarColors = (config, props) => {
    return (0, config_plugins_1.withAndroidColors)(config, (config) => {
        config.modResults = setNavigationBarColors(props, config.modResults);
        return config;
    });
};
const withNavigationBarStyles = (config, props) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = setNavigationBarStyles(props, config.modResults);
        return config;
    });
};
function setNavigationBarColors({ backgroundColor }, colors) {
    if (backgroundColor) {
        colors = config_plugins_1.AndroidConfig.Colors.setColorItem(config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: NAVIGATION_BAR_COLOR,
            value: backgroundColor,
        }), colors);
    }
    return colors;
}
function setNavigationBarStyles({ backgroundColor, barStyle }, styles) {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: !!backgroundColor,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: `android:${NAVIGATION_BAR_COLOR}`,
        value: `@color/${NAVIGATION_BAR_COLOR}`,
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setButtonStyleAsync('dark')` should do the same thing.
        add: barStyle === 'dark',
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightNavigationBar',
        value: 'true',
    });
    return styles;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withNavigationBar, pkg.name, pkg.version);
