"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidNavigationBarExpoGoManifest = void 0;
exports.resolveProps = resolveProps;
exports.setStrings = setStrings;
exports.setNavigationBarStyles = setNavigationBarStyles;
exports.applyEnforceNavigationBarContrast = applyEnforceNavigationBarContrast;
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const debug = (0, debug_1.default)('expo:system-navigation-bar:plugin');
const pkg = require('expo-navigation-bar/package.json');
const EDGE_TO_EDGE_DEPRECATION_MESSAGE = 'property is deprecated due to Android 15 edge-to-edge enforcement and will be removed from Expo SDK';
// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
const LEGACY_BAR_STYLE_MAP = {
    // Match expo-status-bar
    'dark-content': 'dark',
    'light-content': 'light',
};
function resolveProps(config, props) {
    if (!props) {
        const { androidNavigationBar } = config;
        return {
            enforceContrast: androidNavigationBar?.enforceContrast,
            barStyle: androidNavigationBar?.barStyle
                ? LEGACY_BAR_STYLE_MAP[androidNavigationBar?.barStyle]
                : undefined,
        };
    }
    if ('backgroundColor' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.backgroundColor', EDGE_TO_EDGE_DEPRECATION_MESSAGE);
    }
    if ('behavior' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.behavior', EDGE_TO_EDGE_DEPRECATION_MESSAGE);
    }
    if ('borderColor' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.borderColor', EDGE_TO_EDGE_DEPRECATION_MESSAGE);
    }
    if ('position' in props) {
        config_plugins_1.WarningAggregator.addWarningAndroid('androidNavigationBar.position', EDGE_TO_EDGE_DEPRECATION_MESSAGE);
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
            barStyle: Object.entries(LEGACY_BAR_STYLE_MAP).find(([, v]) => v === props.barStyle)?.[0],
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
    config = withNavigationBarStyles(config, props);
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = setStrings(config.modResults, props);
        return config;
    });
};
function setStrings(strings, { visibility }) {
    const stringItems = [];
    if (visibility == null) {
        // Since we're using custom strings, we can remove them for convenience between prebuilds.
        strings = config_plugins_1.AndroidConfig.Strings.removeStringItem(VISIBILITY_KEY, strings);
    }
    else {
        stringItems.push(config_plugins_1.AndroidConfig.Resources.buildResourceItem({
            name: VISIBILITY_KEY,
            value: visibility,
            translatable: false,
        }));
    }
    return config_plugins_1.AndroidConfig.Strings.setStringItem(stringItems, strings);
}
const withNavigationBarStyles = (config, props) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        config.modResults = setNavigationBarStyles(props, config.modResults);
        return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
    });
};
function setNavigationBarStyles({ barStyle }, styles) {
    styles = config_plugins_1.AndroidConfig.Styles.assignStylesValue(styles, {
        // Adding means the buttons will be darker to account for a light background color.
        // `setStyle('dark')` should do the same thing.
        add: barStyle === 'dark',
        parent: config_plugins_1.AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowLightNavigationBar',
        value: 'true',
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
    const enforceIndex = mainTheme.item.findIndex(({ $ }) => $.name === 'android:enforceNavigationBarContrast');
    if (enforceIndex !== -1) {
        style[mainThemeIndex].item[enforceIndex] = enforceNavigationBarContrastItem;
        return config;
    }
    config.modResults.resources.style = [
        {
            $: style[mainThemeIndex].$,
            item: [enforceNavigationBarContrastItem, ...mainTheme.item],
        },
        ...style.filter(({ $ }) => $.name !== 'AppTheme'),
    ];
    return config;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withNavigationBar, pkg.name, pkg.version);
