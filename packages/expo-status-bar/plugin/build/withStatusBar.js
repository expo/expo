"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIOSStatusBarInfoPlist = exports.setAndroidStrings = exports.setAndroidStatusBarStyles = void 0;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_status_bar_visibility';
const IOS_BAR_STYLE_MAP = {
    dark: 'UIStatusBarStyleDarkContent',
    light: 'UIStatusBarStyleLightContent',
};
const setAndroidStatusBarStyles = (styles, { style }) => {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: style != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightStatusBar',
        value: String(style === 'dark'),
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: true,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:statusBarColor',
        value: '@android:color/transparent',
    });
    return styles;
};
exports.setAndroidStatusBarStyles = setAndroidStatusBarStyles;
const withAndroidStatusBarStyles = (config, props) => {
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
const withAndroidStatusBarStringsXml = (config, props) => {
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
const withStatusBar = (config, props) => {
    if (props == null) {
        return config;
    }
    // Elevate props to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = props;
    config = withAndroidStatusBarStyles(config, props);
    config = withAndroidStatusBarStringsXml(config, props);
    return withIOSStatusBarInfoPlist(config, props);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withStatusBar, pkg.name, pkg.version);
