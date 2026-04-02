"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withStatusBarExpoGoManifest = exports.setIOSStatusBarInfoPlist = exports.setAndroidStrings = exports.setAndroidStatusBarStyles = exports.resolveAndroidLegacyProps = void 0;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_status_bar_visibility';
const LEGACY_BAR_STYLE_MAP = {
    'dark-content': 'dark',
    'light-content': 'light',
};
const IOS_BAR_STYLE_MAP = {
    dark: 'UIStatusBarStyleDarkContent',
    light: 'UIStatusBarStyleLightContent',
};
const resolveAndroidLegacyProps = (config) => {
    const { androidStatusBar = {} } = config;
    const { barStyle, hidden } = androidStatusBar;
    return {
        style: barStyle != null ? LEGACY_BAR_STYLE_MAP[barStyle] : undefined,
        hidden,
    };
};
exports.resolveAndroidLegacyProps = resolveAndroidLegacyProps;
const setAndroidStatusBarStyles = (styles, { style }) => config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style === 'dark',
    parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightStatusBar',
    value: 'true',
});
exports.setAndroidStatusBarStyles = setAndroidStatusBarStyles;
const withAndroidStatusBarStyles = (config, _props) => {
    const props = _props ?? (0, exports.resolveAndroidLegacyProps)(config);
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = (0, exports.setAndroidStatusBarStyles)(config.modResults, props);
        return config;
    });
};
const setAndroidStrings = (strings, { hidden }) => {
    if (hidden == null) {
        // Since we're using custom strings, we can remove them for convenience between prebuilds.
        return config_plugins_1.AndroidConfig.Strings.removeStringItem(VISIBILITY_KEY, strings);
    }
    const item = config_plugins_1.AndroidConfig.Resources.buildResourceItem({
        name: VISIBILITY_KEY,
        value: hidden ? 'hidden' : 'visible',
        translatable: false,
    });
    return config_plugins_1.AndroidConfig.Strings.setStringItem([item], strings);
};
exports.setAndroidStrings = setAndroidStrings;
const withAndroidStatusBarStringsXml = (config, _props) => {
    const props = _props ?? (0, exports.resolveAndroidLegacyProps)(config);
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = (0, exports.setAndroidStrings)(config.modResults, props);
        return config;
    });
};
const setIOSStatusBarInfoPlist = (plist, { hidden, style } = {}) => {
    if (hidden != null) {
        plist.UIStatusBarHidden = hidden;
    }
    if (style != null) {
        plist.UIStatusBarStyle = IOS_BAR_STYLE_MAP[style];
    }
    return plist;
};
exports.setIOSStatusBarInfoPlist = setIOSStatusBarInfoPlist;
const withIOSStatusBarInfoPlist = (config, props) => (0, config_plugins_1.withInfoPlist)(config, (config) => {
    config.modResults = (0, exports.setIOSStatusBarInfoPlist)(config.modResults, props);
    return config;
});
/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidStatusBar`).
 */
const withStatusBarExpoGoManifest = (config, _props) => {
    const props = _props ?? (0, exports.resolveAndroidLegacyProps)(config);
    // TODO: Read this from Expo Go instead of `androidStatusBar`.
    // Elevate props to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = props;
    if (config.androidStatusBar != null) {
        return config;
    }
    const barStyle = Object.entries(LEGACY_BAR_STYLE_MAP).find(([, value]) => value === props.style)?.[0];
    // Remap the config plugin props so Expo Go knows how to apply them.
    config.androidStatusBar = { barStyle, hidden: props.hidden };
    return config;
};
exports.withStatusBarExpoGoManifest = withStatusBarExpoGoManifest;
const withStatusBar = (config, props) => {
    config = withAndroidStatusBarStyles(config, props);
    config = withAndroidStatusBarStringsXml(config, props);
    config = withIOSStatusBarInfoPlist(config, props);
    return (0, exports.withStatusBarExpoGoManifest)(config, props);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withStatusBar, pkg.name, pkg.version);
