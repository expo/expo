"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIOSStatusBarInfoPlist = exports.setAndroidStatusBarStyles = void 0;
exports.resolveProps = resolveProps;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
const IOS_BAR_STYLE_MAP = {
    dark: 'UIStatusBarStyleDarkContent',
    light: 'UIStatusBarStyleLightContent',
};
function resolveProps(props) {
    if (props == null) {
        return;
    }
    const { hidden, style } = props;
    const resolvedProps = {
        ...(style != null && { style }),
        ...(hidden != null && { hidden }),
    };
    if (Object.keys(resolvedProps).length > 0) {
        return resolvedProps;
    }
    return;
}
const setAndroidStatusBarStyles = (styles, { hidden, style }) => {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: hidden != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'expoStatusBarHidden',
        value: String(hidden),
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: style != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightStatusBar',
        value: String(style === 'dark'),
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
const withStatusBar = (config, _props) => {
    const props = resolveProps(_props);
    if (props == null) {
        return config;
    }
    // Elevate props to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = props;
    config = withAndroidStatusBarStyles(config, props);
    return withIOSStatusBarInfoPlist(config, props);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withStatusBar, pkg.name, pkg.version);
