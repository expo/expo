"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProps = resolveProps;
exports.setStrings = setStrings;
exports.setNavigationBarStyles = setNavigationBarStyles;
exports.applyEnforceNavigationBarContrast = applyEnforceNavigationBarContrast;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
function resolveProps(props) {
    if (props == null) {
        return;
    }
    if ('barStyle' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('expo-navigation-bar barStyle', 'Use `style` instead. This will be removed in a future release.');
    }
    if ('visibility' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('expo-navigation-bar visibility', 'Use `hidden` instead. This will be removed in a future release.');
    }
    const { enforceContrast } = props;
    const style = props.style ?? props.barStyle ?? undefined;
    const hidden = props.hidden ?? (props.visibility == null ? undefined : props.visibility === 'hidden');
    const resolvedProps = {
        ...(enforceContrast != null && { enforceContrast }),
        ...(style != null && { style }),
        ...(hidden != null && { hidden }),
    };
    if (Object.keys(resolvedProps).length > 0) {
        return resolvedProps;
    }
}
const withNavigationBar = (config, _props) => {
    const props = resolveProps(_props);
    if (props == null) {
        return config;
    }
    // Elevate props to a static value on extra so Expo Go can read it.
    config.extra ??= {};
    config.extra[pkg.name] = props;
    // Use built-in styles instead of Expo custom properties, this makes the project hopefully a bit more predictable for bare users.
    config = withNavigationBarStyles(config, props);
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = setStrings(config.modResults, props);
        return config;
    });
};
function setStrings(strings, { hidden }) {
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
}
const withNavigationBarStyles = (config, props) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = setNavigationBarStyles(props, config.modResults);
        return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
    });
};
function setNavigationBarStyles({ style }, styles) {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: style != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightNavigationBar',
        value: String(style === 'dark'),
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: true,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:navigationBarColor',
        value: '@android:color/transparent',
    });
    return styles;
}
function applyEnforceNavigationBarContrast(config, enforceNavigationBarContrast) {
    const enforceNavigationBarContrastItem = {
        _: enforceNavigationBarContrast ? 'true' : 'false',
        $: {
            name: 'android:enforceNavigationBarContrast',
            'tools:targetApi': '29',
        },
    };
    const { style = [] } = config.modResults.resources;
    const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');
    if (mainThemeIndex === -1) {
        return config;
    }
    const mainTheme = style[mainThemeIndex];
    if (mainTheme != null) {
        const enforceIndex = mainTheme.item.findIndex(({ $ }) => $.name === 'android:enforceNavigationBarContrast');
        if (enforceIndex !== -1) {
            mainTheme.item[enforceIndex] = enforceNavigationBarContrastItem;
            return config;
        }
        config.modResults.resources.style = [
            {
                $: mainTheme.$,
                item: [enforceNavigationBarContrastItem, ...mainTheme.item],
            },
            ...style.filter(({ $ }) => $.name !== 'AppTheme'),
        ];
    }
    return config;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withNavigationBar, pkg.name, pkg.version);
