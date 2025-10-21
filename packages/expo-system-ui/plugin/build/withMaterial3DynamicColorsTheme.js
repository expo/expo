"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMaterial3DynamicColorsTheme = void 0;
const android_plugins_js_1 = require("@expo/config-plugins/build/plugins/android-plugins.js");
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const debug = (0, debug_1.default)('expo-system-ui:withMaterial3DynamicColorsTheme');
const withMaterial3DynamicColorsTheme = (config) => {
    if (config.experiments?.material3DynamicColorsTheme === true) {
        debug('✅ Enabling Material3 Dynamic Colors theme for Android');
        config = (0, config_plugins_1.withAndroidStyles)(config, (config) => {
            config.modResults = replaceAppThemeParent(config.modResults, 'Theme.Material3.DynamicColors.DayNight.NoActionBar');
            config.modResults = addExpoDynamicColorsToAppTheme(config.modResults);
            return config;
        });
        config = (0, android_plugins_js_1.withAndroidAttrs)(config, (config) => {
            config.modResults = addExpoDynamicColorsAttrs(config.modResults);
            return config;
        });
    }
    return config;
};
exports.withMaterial3DynamicColorsTheme = withMaterial3DynamicColorsTheme;
function replaceAppThemeParent(styles, newParent) {
    const group = {
        name: 'AppTheme',
        parent: newParent,
    };
    styles.resources.style = styles.resources.style?.map?.((style) => {
        const head = style.$;
        if (head.name === group.name) {
            return {
                ...style,
                $: {
                    ...head,
                    parent: group.parent,
                },
            };
        }
        return style;
    });
    return styles;
}
function addExpoDynamicColorsToAppTheme(styles) {
    const name = 'AppTheme';
    styles.resources.style = styles.resources.style?.map?.((style) => {
        const head = style.$;
        if (head.name === name) {
            return {
                ...style,
                // e.g. <item name="expoMaterialPrimary">?attr/colorPrimary</item>
                item: [
                    ...(style.item ?? []),
                    ...customItems.map((item) => ({
                        $: {
                            name: item,
                        },
                        _: `?attr/${item.replace('expoMaterial', 'color')}`,
                    })),
                ],
            };
        }
        return style;
    });
    return styles;
}
function addExpoDynamicColorsAttrs(attrs) {
    const existingAttrs = attrs.resources.attr ?? [];
    attrs.resources.attr = [
        ...existingAttrs,
        ...customItems.map((item) => ({
            $: {
                name: item,
                format: 'reference',
            },
        })),
    ];
    return attrs;
}
const customItems = [
    'expoMaterialPrimary',
    'expoMaterialOnPrimary',
    'expoMaterialPrimaryContainer',
    'expoMaterialOnPrimaryContainer',
    'expoMaterialPrimaryInverse',
    'expoMaterialPrimaryFixed',
    'expoMaterialPrimaryFixedDim',
    'expoMaterialOnPrimaryFixed',
    'expoMaterialOnPrimaryFixedVariant',
    'expoMaterialSecondary',
    'expoMaterialOnSecondary',
    'expoMaterialSecondaryContainer',
    'expoMaterialOnSecondaryContainer',
    'expoMaterialSecondaryFixed',
    'expoMaterialSecondaryFixedDim',
    'expoMaterialOnSecondaryFixed',
    'expoMaterialOnSecondaryFixedVariant',
    'expoMaterialTertiary',
    'expoMaterialOnTertiary',
    'expoMaterialTertiaryContainer',
    'expoMaterialOnTertiaryContainer',
    'expoMaterialTertiaryFixed',
    'expoMaterialTertiaryFixedDim',
    'expoMaterialOnTertiaryFixed',
    'expoMaterialOnTertiaryFixedVariant',
    'expoMaterialError',
    'expoMaterialOnError',
    'expoMaterialErrorContainer',
    'expoMaterialOnErrorContainer',
    'expoMaterialOutline',
    'expoMaterialOutlineVariant',
    'expoMaterialOnBackground',
    'expoMaterialSurface',
    'expoMaterialOnSurface',
    'expoMaterialSurfaceVariant',
    'expoMaterialOnSurfaceVariant',
    'expoMaterialSurfaceInverse',
    'expoMaterialOnSurfaceInverse',
    'expoMaterialSurfaceBright',
    'expoMaterialSurfaceDim',
    'expoMaterialSurfaceContainer',
    'expoMaterialSurfaceContainerLow',
    'expoMaterialSurfaceContainerLowest',
    'expoMaterialSurfaceContainerHigh',
    'expoMaterialSurfaceContainerHighest',
];
