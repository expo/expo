"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandardAppearanceFromOptions = createStandardAppearanceFromOptions;
exports.createScrollEdgeAppearanceFromOptions = createScrollEdgeAppearanceFromOptions;
exports.createAndroidScreenAppearance = createAndroidScreenAppearance;
function createStandardAppearanceFromOptions(_options) {
    return {};
}
function createScrollEdgeAppearanceFromOptions(_options) {
    return {};
}
function appendSelectedStyleToAppearance(selectedStyle, appearance) {
    return appendStyleToAppearance(selectedStyle, appearance, ['selected', 'focused']);
}
const EMPTY_APPEARANCE_ITEM = {
    normal: {},
    selected: {},
    focused: {},
    disabled: {},
};
function appendStyleToAppearance(style, appearance, states) {
    const baseItemAppearance = appearance.stacked || appearance.inline || appearance.compactInline || {};
    const styleAppearance = convertStyleToAppearance(style);
    const newAppearances = states.map((state) => ({
        key: state,
        appearance: {
            ...baseItemAppearance.normal,
            ...baseItemAppearance[state],
            ...styleAppearance.stacked?.normal,
            ...styleAppearance.stacked?.[state],
        },
    }));
    const itemAppearance = {
        ...EMPTY_APPEARANCE_ITEM,
        ...baseItemAppearance,
        ...Object.fromEntries(newAppearances.map(({ key, appearance }) => [key, appearance])),
    };
    return {
        stacked: itemAppearance,
        inline: itemAppearance,
        compactInline: itemAppearance,
        tabBarBackgroundColor: style.backgroundColor === null
            ? undefined
            : (style.backgroundColor ?? appearance.tabBarBackgroundColor),
        tabBarBlurEffect: styleAppearance.tabBarBlurEffect ?? appearance.tabBarBlurEffect,
        tabBarShadowColor: styleAppearance.tabBarShadowColor ?? appearance.tabBarShadowColor,
    };
}
function convertStyleToAppearance(style) {
    if (!style) {
        return {};
    }
    const stateAppearance = convertStyleToItemStateAppearance(style);
    const itemAppearance = {
        normal: stateAppearance,
        selected: stateAppearance,
        focused: stateAppearance,
        disabled: {},
    };
    return {
        inline: itemAppearance,
        stacked: itemAppearance,
        compactInline: itemAppearance,
        tabBarBackgroundColor: style?.backgroundColor ?? undefined,
        tabBarBlurEffect: style?.blurEffect,
        tabBarShadowColor: style?.shadowColor,
    };
}
function convertStyleToItemStateAppearance(style) {
    if (!style) {
        return {};
    }
    const stateAppearance = {
        tabBarItemBadgeBackgroundColor: style.badgeBackgroundColor,
        tabBarItemTitlePositionAdjustment: style.titlePositionAdjustment,
        tabBarItemIconColor: style.iconColor,
        tabBarItemTitleFontFamily: style.fontFamily,
        tabBarItemTitleFontSize: style.fontSize,
        tabBarItemTitleFontWeight: (0, style_1.convertFontWeightToStringFontWeight)(style.fontWeight),
        tabBarItemTitleFontStyle: style.fontStyle,
        tabBarItemTitleFontColor: style.color,
    };
    Object.keys(stateAppearance).forEach((key) => {
        if (stateAppearance[key] === undefined) {
            delete stateAppearance[key];
        }
    });
    return stateAppearance;
}
function createAndroidScreenAppearance({ options, tintColor, rippleColor, disableIndicator, labelVisibilityMode, }) {
    const labelStyle = options.labelStyle;
    const selectedLabelStyle = options.selectedLabelStyle;
    const normal = {
        tabBarItemTitleFontColor: labelStyle?.color ?? color_1.Color.android.dynamic.onSurfaceVariant,
        tabBarItemIconColor: options.iconColor ?? color_1.Color.android.dynamic.onSurfaceVariant,
    };
    const selected = {
        tabBarItemTitleFontColor: selectedLabelStyle?.color ??
            labelStyle?.color ??
            tintColor ??
            color_1.Color.android.dynamic.onSurface,
        tabBarItemIconColor: options.selectedIconColor ??
            options.iconColor ??
            tintColor ??
            color_1.Color.android.dynamic.onSecondaryContainer,
    };
    return {
        tabBarBackgroundColor: options.backgroundColor ?? color_1.Color.android.dynamic.surfaceContainer,
        tabBarItemRippleColor: rippleColor ?? color_1.Color.android.dynamic.primary,
        tabBarItemLabelVisibilityMode: labelVisibilityMode,
        tabBarItemActiveIndicatorColor: options.indicatorColor ?? color_1.Color.android.dynamic.secondaryContainer,
        tabBarItemActiveIndicatorEnabled: !disableIndicator,
        tabBarItemTitleFontFamily: labelStyle?.fontFamily,
        tabBarItemTitleSmallLabelFontSize: labelStyle?.fontSize,
        tabBarItemTitleLargeLabelFontSize: selectedLabelStyle?.fontSize ?? labelStyle?.fontSize,
        tabBarItemTitleFontWeight: labelStyle?.fontWeight,
        tabBarItemTitleFontStyle: labelStyle?.fontStyle,
        tabBarItemBadgeBackgroundColor: options.badgeBackgroundColor,
        tabBarItemBadgeTextColor: options.badgeTextColor,
        normal,
        selected,
    };
function createAndroidScreenAppearance(_options) {
    return {};
}
//# sourceMappingURL=appearance.js.map