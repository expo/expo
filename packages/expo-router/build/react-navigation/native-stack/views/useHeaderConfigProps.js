"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHeaderConfigProps = useHeaderConfigProps;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const FontProcessor_1 = require("./FontProcessor");
const color_1 = require("../../../utils/color");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
const processBarButtonItems = (items, colors, fonts) => {
    return items
        ?.map((item, index) => {
        if (item.type === 'custom') {
            // Handled with `ScreenStackHeaderLeftView` or `ScreenStackHeaderRightView`
            return null;
        }
        if (item.type === 'spacing') {
            if (item.spacing == null) {
                throw new Error(`Spacing item must have a 'spacing' property defined: ${JSON.stringify(item)}`);
            }
            return item;
        }
        if (item.type === 'button' || item.type === 'menu') {
            if (item.type === 'menu' && item.menu == null) {
                throw new Error(`Menu item must have a 'menu' property defined: ${JSON.stringify(item)}`);
            }
            const { badge, label, labelStyle, icon, ...rest } = item;
            const processedItemCommon = {
                ...rest,
                index,
                title: label,
                titleStyle: {
                    ...fonts.regular,
                    ...labelStyle,
                },
                icon: transformIcon(icon),
            };
            let processedItem;
            if (processedItemCommon.type === 'menu' && item.type === 'menu') {
                const { multiselectable, layout } = item.menu;
                processedItem = {
                    ...processedItemCommon,
                    menu: {
                        ...processedItemCommon.menu,
                        singleSelection: !multiselectable,
                        displayAsPalette: layout === 'palette',
                        items: item.menu.items.map(getMenuItem),
                    },
                };
            }
            else if (processedItemCommon.type === 'button' && item.type === 'button') {
                processedItem = processedItemCommon;
            }
            else {
                throw new Error(`Invalid item type: ${JSON.stringify(item)}. Valid types are 'button' and 'menu'.`);
            }
            if (badge) {
                const badgeBackgroundColor = badge.style?.backgroundColor ?? colors.notification;
                const badgeTextColor = (0, color_1.Color)(badgeBackgroundColor)?.isLight() ? 'black' : 'white';
                processedItem = {
                    ...processedItem,
                    badge: {
                        ...badge,
                        value: String(badge.value),
                        style: {
                            backgroundColor: badgeBackgroundColor,
                            color: badgeTextColor,
                            ...fonts.regular,
                            ...badge.style,
                        },
                    },
                };
            }
            return processedItem;
        }
        throw new Error(`Invalid item type: ${JSON.stringify(item)}. Valid types are 'button', 'menu', 'custom' and 'spacing'.`);
    })
        .filter((item) => item != null);
};
const transformIcon = (icon) => {
    if (icon?.type === 'image') {
        return icon.tinted === false
            ? { type: 'imageSource', imageSource: icon.source }
            : { type: 'templateSource', templateSource: icon.source };
    }
    return icon;
};
const getMenuItem = (item) => {
    if (item.type === 'submenu') {
        const { label, icon, inline, layout, items, multiselectable, ...rest } = item;
        return {
            ...rest,
            icon: transformIcon(icon),
            title: label,
            displayAsPalette: layout === 'palette',
            displayInline: inline,
            singleSelection: !multiselectable,
            items: items.map(getMenuItem),
        };
    }
    const { label, icon, description, ...rest } = item;
    return {
        ...rest,
        icon: transformIcon(icon),
        title: label,
        subtitle: description,
    };
};
function useHeaderConfigProps({ headerBackIcon, headerBackImageSource, headerBackButtonDisplayMode, headerBackButtonMenuEnabled, headerBackTitle, headerBackTitleStyle, headerBackVisible, headerShadowVisible, headerLargeStyle, headerLargeTitle: headerLargeTitleDeprecated, headerLargeTitleEnabled = headerLargeTitleDeprecated, headerLargeTitleShadowVisible, headerLargeTitleStyle, headerBackground, headerLeft, headerRight, headerShown, headerStyle, headerBlurEffect, headerTintColor, headerTitle, headerTitleAlign, headerTitleStyle, headerTransparent, headerSearchBarOptions, headerTopInsetEnabled, headerBack, route, title, unstable_headerLeftItems: headerLeftItems, unstable_headerRightItems: headerRightItems, }) {
    const { direction } = (0, native_1.useLocale)();
    const { colors, fonts, dark } = (0, native_1.useTheme)();
    const tintColor = headerTintColor ?? (react_native_1.Platform.OS === 'ios' ? colors.primary : colors.text);
    const headerBackTitleStyleFlattened = react_native_1.StyleSheet.flatten([fonts.regular, headerBackTitleStyle]) || {};
    const headerLargeTitleStyleFlattened = react_native_1.StyleSheet.flatten([
        react_native_1.Platform.select({ ios: fonts.heavy, default: fonts.medium }),
        headerLargeTitleStyle,
    ]) || {};
    const headerTitleStyleFlattened = react_native_1.StyleSheet.flatten([
        react_native_1.Platform.select({ ios: fonts.bold, default: fonts.medium }),
        headerTitleStyle,
    ]) || {};
    const headerStyleFlattened = react_native_1.StyleSheet.flatten(headerStyle) || {};
    const headerLargeStyleFlattened = react_native_1.StyleSheet.flatten(headerLargeStyle) || {};
    const [backTitleFontFamily, largeTitleFontFamily, titleFontFamily] = (0, FontProcessor_1.processFonts)([
        headerBackTitleStyleFlattened.fontFamily,
        headerLargeTitleStyleFlattened.fontFamily,
        headerTitleStyleFlattened.fontFamily,
    ]);
    const backTitleFontSize = 'fontSize' in headerBackTitleStyleFlattened
        ? headerBackTitleStyleFlattened.fontSize
        : undefined;
    const titleText = (0, elements_1.getHeaderTitle)({ title, headerTitle }, route.name);
    const titleColor = 'color' in headerTitleStyleFlattened
        ? headerTitleStyleFlattened.color
        : (headerTintColor ?? colors.text);
    const titleFontSize = 'fontSize' in headerTitleStyleFlattened ? headerTitleStyleFlattened.fontSize : undefined;
    const titleFontWeight = headerTitleStyleFlattened.fontWeight;
    const largeTitleBackgroundColor = headerLargeStyleFlattened.backgroundColor;
    const largeTitleColor = 'color' in headerLargeTitleStyleFlattened ? headerLargeTitleStyleFlattened.color : undefined;
    const largeTitleFontSize = 'fontSize' in headerLargeTitleStyleFlattened
        ? headerLargeTitleStyleFlattened.fontSize
        : undefined;
    const largeTitleFontWeight = headerLargeTitleStyleFlattened.fontWeight;
    const headerTitleStyleSupported = { color: titleColor };
    if (headerTitleStyleFlattened.fontFamily != null) {
        headerTitleStyleSupported.fontFamily = headerTitleStyleFlattened.fontFamily;
    }
    if (titleFontSize != null) {
        headerTitleStyleSupported.fontSize = titleFontSize;
    }
    if (titleFontWeight != null) {
        headerTitleStyleSupported.fontWeight = titleFontWeight;
    }
    const headerBackgroundColor = headerStyleFlattened.backgroundColor ??
        (headerBackground != null ||
            headerTransparent ||
            // The title becomes invisible if background color is set with large title on iOS 26
            (react_native_1.Platform.OS === 'ios' && headerLargeTitleEnabled)
            ? 'transparent'
            : colors.card);
    const canGoBack = headerBack != null;
    const headerLeftElement = headerLeft?.({
        tintColor,
        canGoBack,
        backgroundColor: headerBackgroundColor,
        label: headerBackTitle ?? headerBack?.title,
        // `href` is only applicable to web
        href: undefined,
    });
    const headerRightElement = headerRight?.({
        tintColor,
        canGoBack,
        backgroundColor: headerBackgroundColor,
    });
    const headerTitleElement = typeof headerTitle === 'function'
        ? headerTitle({
            tintColor,
            children: titleText,
        })
        : null;
    const supportsHeaderSearchBar = typeof react_native_screens_1.isSearchBarAvailableForCurrentPlatform === 'boolean'
        ? react_native_screens_1.isSearchBarAvailableForCurrentPlatform
        : // Fallback for older versions of react-native-screens
            react_native_1.Platform.OS === 'ios' && react_native_screens_1.SearchBar != null;
    const hasHeaderSearchBar = supportsHeaderSearchBar && headerSearchBarOptions != null;
    /**
     * We need to set this in if:
     * - Back button should stay visible when `headerLeft` is specified
     * - If `headerTitle` for Android is specified, so we only need to remove the title and keep the back button
     */
    const backButtonInCustomView = headerBackVisible ||
        (react_native_1.Platform.OS === 'android' && headerTitleElement != null && headerLeftElement == null);
    const translucent = headerBackground != null ||
        headerTransparent ||
        // When using a SearchBar or large title, the header needs to be translucent for it to work on iOS
        ((hasHeaderSearchBar || headerLargeTitleEnabled) &&
            react_native_1.Platform.OS === 'ios' &&
            headerTransparent !== false);
    const isBackButtonDisplayModeAvailable = 
    // On iOS 14+
    react_native_1.Platform.OS === 'ios' &&
        parseInt(react_native_1.Platform.Version, 10) >= 14 &&
        // Doesn't have custom styling, by default System, see: https://github.com/software-mansion/react-native-screens/pull/2105#discussion_r1565222738
        (backTitleFontFamily == null || backTitleFontFamily === 'System') &&
        backTitleFontSize == null &&
        // Back button menu is not disabled
        headerBackButtonMenuEnabled !== false;
    const isCenterViewRenderedAndroid = headerTitleAlign === 'center';
    const leftItems = headerLeftItems?.({
        tintColor,
        canGoBack,
    });
    let rightItems = headerRightItems?.({
        tintColor,
        canGoBack,
    });
    if (rightItems) {
        // iOS renders right items in reverse order
        // So we need to reverse them here to match the order
        rightItems = [...rightItems].reverse();
    }
    const children = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [react_native_1.Platform.OS === 'ios' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [leftItems ? (leftItems.map((item, index) => {
                        if (item.type === 'custom') {
                            return ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderLeftView, { hidesSharedBackground: item.hidesSharedBackground, children: item.element }, index));
                        }
                        return null;
                    })) : headerLeftElement != null ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderLeftView, { children: headerLeftElement })) : null, headerTitleElement != null ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderCenterView, { children: headerTitleElement })) : null] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [headerLeftElement != null || typeof headerTitle === 'function' ? ((0, jsx_runtime_1.jsxs)(react_native_screens_1.ScreenStackHeaderLeftView, { style: !isCenterViewRenderedAndroid ? { flex: 1 } : null, children: [headerLeftElement, headerTitleAlign !== 'center' ? (typeof headerTitle === 'function' ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1 }, children: headerTitleElement })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1 }, children: (0, jsx_runtime_1.jsx)(elements_1.HeaderTitle, { tintColor: tintColor, style: headerTitleStyleSupported, children: titleText }) }))) : null] })) : null, isCenterViewRenderedAndroid ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderCenterView, { children: typeof headerTitle === 'function' ? (headerTitleElement) : ((0, jsx_runtime_1.jsx)(elements_1.HeaderTitle, { tintColor: tintColor, style: headerTitleStyleSupported, children: titleText })) })) : null] })), headerBackIcon !== undefined || headerBackImageSource !== undefined ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderBackButtonImage, { source: headerBackIcon?.source ?? headerBackImageSource })) : null, react_native_1.Platform.OS === 'ios' && rightItems ? (rightItems.map((item, index) => {
                if (item.type === 'custom') {
                    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderRightView, { hidesSharedBackground: item.hidesSharedBackground, children: item.element }, index));
                }
                return null;
            })) : headerRightElement != null ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderRightView, { children: headerRightElement })) : null, hasHeaderSearchBar ? ((0, jsx_runtime_1.jsx)(react_native_screens_1.ScreenStackHeaderSearchBarView, { children: (0, jsx_runtime_1.jsx)(react_native_screens_1.SearchBar, { ...headerSearchBarOptions }) })) : null] }));
    return {
        backButtonInCustomView,
        backgroundColor: headerBackgroundColor,
        backTitle: headerBackTitle,
        backTitleVisible: isBackButtonDisplayModeAvailable
            ? undefined
            : headerBackButtonDisplayMode !== 'minimal',
        backButtonDisplayMode: isBackButtonDisplayModeAvailable
            ? headerBackButtonDisplayMode
            : undefined,
        backTitleFontFamily,
        backTitleFontSize,
        blurEffect: headerBlurEffect,
        color: tintColor,
        direction,
        disableBackButtonMenu: headerBackButtonMenuEnabled === false,
        hidden: headerShown === false,
        hideBackButton: headerBackVisible === false,
        hideShadow: headerShadowVisible === false ||
            headerBackground != null ||
            (headerTransparent && headerShadowVisible !== true),
        largeTitle: headerLargeTitleEnabled,
        largeTitleBackgroundColor,
        largeTitleColor,
        largeTitleFontFamily,
        largeTitleFontSize,
        largeTitleFontWeight,
        largeTitleHideShadow: headerLargeTitleShadowVisible === false,
        title: titleText,
        titleColor,
        titleFontFamily,
        titleFontSize,
        titleFontWeight: String(titleFontWeight),
        topInsetEnabled: headerTopInsetEnabled,
        translucent: translucent === true,
        children,
        headerLeftBarButtonItems: processBarButtonItems(leftItems, colors, fonts),
        headerRightBarButtonItems: processBarButtonItems(rightItems, colors, fonts),
        experimental_userInterfaceStyle: dark ? 'dark' : 'light',
    };
}
//# sourceMappingURL=useHeaderConfigProps.js.map