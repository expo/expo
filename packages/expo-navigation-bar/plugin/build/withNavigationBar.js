"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNavigationBarStyles = void 0;
exports.resolveProps = resolveProps;
exports.applyEnforceNavigationBarContrast = applyEnforceNavigationBarContrast;
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
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
    return;
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
    return withNavigationBarStyles(config, props);
};
const withNavigationBarStyles = (config, props) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = (0, exports.setNavigationBarStyles)(props, config.modResults);
        return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
    });
};
const setNavigationBarStyles = ({ hidden, style }, styles) => {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        add: hidden != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'expoNavigationBarHidden',
        value: String(hidden),
    });
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: style != null,
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightNavigationBar',
        value: String(style === 'dark'),
    });
    return styles;
};
exports.setNavigationBarStyles = setNavigationBarStyles;
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
