"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandardAppearanceFromOptions = createStandardAppearanceFromOptions;
exports.createScrollEdgeAppearanceFromOptions = createScrollEdgeAppearanceFromOptions;
exports.appendSelectedStyleToAppearance = appendSelectedStyleToAppearance;
exports.appendStyleToAppearance = appendStyleToAppearance;
exports.convertStyleToAppearance = convertStyleToAppearance;
exports.convertStyleToItemStateAppearance = convertStyleToItemStateAppearance;
const types_1 = require("./types");
function createStandardAppearanceFromOptions(options, baseStandardAppearance) {
    const appearance = appendStyleToAppearance({
        ...options.labelStyle,
        iconColor: options.iconColor,
        backgroundColor: options.backgroundColor,
        blurEffect: options.blurEffect,
        badgeBackgroundColor: options.badgeBackgroundColor,
        titlePositionAdjustment: options.titlePositionAdjustment,
    }, baseStandardAppearance, ['normal', 'focused', 'selected']);
    return appendSelectedStyleToAppearance({
        ...(options.selectedLabelStyle ?? {}),
        iconColor: options.selectedIconColor,
        badgeBackgroundColor: options.selectedBadgeBackgroundColor,
        titlePositionAdjustment: options.selectedTitlePositionAdjustment,
    }, appearance);
}
function createScrollEdgeAppearanceFromOptions(options, baseScrollEdgeAppearance) {
    const appearance = appendStyleToAppearance({
        ...options.labelStyle,
        iconColor: options.iconColor,
        blurEffect: options.disableTransparentOnScrollEdge ? options.blurEffect : 'none',
        backgroundColor: options.disableTransparentOnScrollEdge ? options.backgroundColor : null,
        badgeBackgroundColor: options.badgeBackgroundColor,
        titlePositionAdjustment: options.titlePositionAdjustment,
    }, baseScrollEdgeAppearance, ['normal', 'focused', 'selected']);
    return appendSelectedStyleToAppearance({
        ...(options.selectedLabelStyle ?? {}),
        iconColor: options.selectedIconColor,
        badgeBackgroundColor: options.selectedBadgeBackgroundColor,
        titlePositionAdjustment: options.selectedTitlePositionAdjustment,
    }, appearance);
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
    let tabBarBlurEffect = style?.blurEffect;
    if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
        console.warn(`Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        tabBarBlurEffect = undefined;
    }
    const baseItemAppearance = appearance.stacked || appearance.inline || appearance.compactInline || {};
    const styleAppearance = convertStyleToAppearance(style);
    const newAppearances = states.map((state) => ({
        key: state,
        appearance: {
            ...baseItemAppearance.normal,
            ...baseItemAppearance[state],
            ...styleAppearance.stacked?.normal,
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
        tabBarBlurEffect: tabBarBlurEffect ?? appearance.tabBarBlurEffect,
    };
}
const supportedBlurEffectsSet = new Set(types_1.SUPPORTED_BLUR_EFFECTS);
function convertStyleToAppearance(style) {
    if (!style) {
        return {};
    }
    let blurEffect = style.blurEffect;
    if (style.blurEffect && !supportedBlurEffectsSet.has(style.blurEffect)) {
        console.warn(`Unsupported blurEffect: ${style.blurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        blurEffect = undefined;
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
        tabBarBlurEffect: blurEffect,
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
        // Only string values are accepted by rn-screens
        tabBarItemTitleFontWeight: style?.fontWeight
            ? String(style.fontWeight)
            : undefined,
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
//# sourceMappingURL=appearance.js.map