"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertOptionsToHeaderConfig = convertOptionsToHeaderConfig;
const react_native_1 = require("react-native");
/**
 * Converts `NativeStackOptions` to `ScreenStackHeaderConfigProps` for `ScreenStackItem`.
 */
function convertOptionsToHeaderConfig(options, routeName, canGoBack) {
    const titleStyle = react_native_1.StyleSheet.flatten(options.headerTitleStyle) || {};
    const largeTitleStyle = react_native_1.StyleSheet.flatten(options.headerLargeTitleStyle) || {};
    const blurEffect = options.headerBlurEffect;
    const largeTitle = options.headerLargeTitle;
    const transparent = options.headerTransparent;
    return {
        title: options.title ?? routeName,
        hidden: options.headerShown === false,
        backTitle: options.headerBackTitle,
        backButtonDisplayMode: options.headerBackButtonDisplayMode,
        color: options.headerTintColor,
        backgroundColor: options.headerBackgroundColor,
        blurEffect,
        largeTitle,
        largeTitleBackgroundColor: options.headerLargeTitleBackgroundColor,
        hideShadow: options.headerShadowVisible === false,
        translucent: transparent === true || blurEffect != null || largeTitle === true,
        hideBackButton: !canGoBack,
        titleFontFamily: titleStyle.fontFamily,
        titleFontSize: titleStyle.fontSize,
        titleFontWeight: titleStyle.fontWeight != null ? String(titleStyle.fontWeight) : undefined,
        titleColor: titleStyle.color,
        largeTitleFontFamily: largeTitleStyle.fontFamily,
        largeTitleFontSize: largeTitleStyle.fontSize,
        largeTitleFontWeight: largeTitleStyle.fontWeight != null ? String(largeTitleStyle.fontWeight) : undefined,
        largeTitleColor: largeTitleStyle.color,
    };
}
//# sourceMappingURL=headerConfig.js.map