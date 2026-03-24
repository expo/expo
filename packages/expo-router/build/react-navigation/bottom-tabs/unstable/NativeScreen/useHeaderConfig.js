"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHeaderConfig = useHeaderConfig;
const color_1 = __importDefault(require("color"));
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
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
            let processedItem = {
                ...rest,
                index,
                title: label,
                titleStyle: {
                    ...fonts.regular,
                    ...labelStyle,
                },
                icon: icon?.type === 'image'
                    ? icon.tinted === false
                        ? {
                            type: 'imageSource',
                            imageSource: icon.source,
                        }
                        : {
                            type: 'templateSource',
                            templateSource: icon.source,
                        }
                    : icon,
            };
            if (processedItem.type === 'menu' && item.type === 'menu') {
                const { multiselectable, layout } = item.menu;
                processedItem = {
                    ...processedItem,
                    menu: {
                        ...processedItem.menu,
                        singleSelection: !multiselectable,
                        displayAsPalette: layout === 'palette',
                        items: item.menu.items.map(getMenuItem),
                    },
                };
            }
            if (badge) {
                const badgeBackgroundColor = badge.style?.backgroundColor ?? colors.notification;
                const badgeTextColor = typeof badgeBackgroundColor === 'string' && (0, color_1.default)(badgeBackgroundColor)?.isLight()
                    ? 'black'
                    : 'white';
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
const getMenuItem = (item) => {
    if (item.type === 'submenu') {
        const { label, inline, layout, items, multiselectable, ...rest } = item;
        return {
            ...rest,
            title: label,
            displayAsPalette: layout === 'palette',
            displayInline: inline,
            singleSelection: !multiselectable,
            items: items.map(getMenuItem),
        };
    }
    const { label, description, ...rest } = item;
    return {
        ...rest,
        title: label,
        subtitle: description,
    };
};
function useHeaderConfig({ headerShadowVisible, headerLargeStyle, headerLargeTitleEnabled, headerLargeTitleShadowVisible, headerLargeTitleStyle, headerBackground, headerLeft, headerRight, headerShown, headerStyle, headerBlurEffect, headerTintColor, headerTitle, headerTitleAlign, headerTitleStyle, headerTransparent, headerSearchBarOptions, headerTopInsetEnabled, route, title, unstable_headerLeftItems: headerLeftItems, unstable_headerRightItems: headerRightItems, }) {
    const { direction } = (0, native_1.useLocale)();
    const { colors, fonts, dark } = (0, native_1.useTheme)();
    const tintColor = headerTintColor ?? (react_native_1.Platform.OS === 'ios' ? colors.primary : colors.text);
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
    const titleText = (0, elements_1.getHeaderTitle)({ title, headerTitle }, route.name);
    const titleColor = 'color' in headerTitleStyleFlattened
        ? headerTitleStyleFlattened.color
        : (headerTintColor ?? colors.text);
    const titleFontSize = 'fontSize' in headerTitleStyleFlattened ? headerTitleStyleFlattened.fontSize : undefined;
    const titleFontFamily = headerTitleStyleFlattened.fontFamily;
    const titleFontWeight = headerTitleStyleFlattened.fontWeight;
    const largeTitleFontFamily = headerLargeTitleStyleFlattened.fontFamily;
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
        (headerBackground != null || headerTransparent ? 'transparent' : colors.card);
    const headerLeftElement = headerLeft?.({
        tintColor,
    });
    const headerRightElement = headerRight?.({
        tintColor,
    });
    const headerTitleElement = typeof headerTitle === 'function'
        ? headerTitle({
            tintColor,
            children: titleText,
        })
        : null;
    const hasHeaderSearchBar = react_native_screens_1.isSearchBarAvailableForCurrentPlatform && headerSearchBarOptions != null;
    const translucent = headerBackground != null ||
        headerTransparent ||
        // When using a SearchBar or large title, the header needs to be translucent for it to work on iOS
        ((hasHeaderSearchBar || headerLargeTitleEnabled) &&
            react_native_1.Platform.OS === 'ios' &&
            headerTransparent !== false);
    const isCenterViewRenderedAndroid = headerTitleAlign === 'center';
    const leftItems = headerLeftItems?.({
        tintColor,
    });
    let rightItems = headerRightItems?.({
        tintColor,
    });
    if (rightItems) {
        // iOS renders right items in reverse order
        // So we need to reverse them here to match the order
        rightItems = [...rightItems].reverse();
    }
    const children = (<>
      {react_native_1.Platform.OS === 'ios' ? (<>
          {leftItems ? (leftItems.map((item, index) => {
                if (item.type === 'custom') {
                    return (<react_native_screens_1.ScreenStackHeaderLeftView key={index} hidesSharedBackground={item.hidesSharedBackground}>
                    {item.element}
                  </react_native_screens_1.ScreenStackHeaderLeftView>);
                }
                return null;
            })) : headerLeftElement != null ? (<react_native_screens_1.ScreenStackHeaderLeftView>{headerLeftElement}</react_native_screens_1.ScreenStackHeaderLeftView>) : null}
          {headerTitleElement != null ? (<react_native_screens_1.ScreenStackHeaderCenterView>{headerTitleElement}</react_native_screens_1.ScreenStackHeaderCenterView>) : null}
        </>) : (<>
          {headerLeftElement != null || typeof headerTitle === 'function' ? (
            // The style passed to header left, together with title element being wrapped
            // in flex view is reqruied for proper header layout, in particular,
            // for the text truncation to work.
            <react_native_screens_1.ScreenStackHeaderLeftView style={!isCenterViewRenderedAndroid ? { flex: 1 } : null}>
              {headerLeftElement}
              {headerTitleAlign !== 'center' ? (typeof headerTitle === 'function' ? (<react_native_1.View style={{ flex: 1 }}>{headerTitleElement}</react_native_1.View>) : (<react_native_1.View style={{ flex: 1 }}>
                    <elements_1.HeaderTitle tintColor={tintColor} style={headerTitleStyleSupported}>
                      {titleText}
                    </elements_1.HeaderTitle>
                  </react_native_1.View>)) : null}
            </react_native_screens_1.ScreenStackHeaderLeftView>) : null}
          {isCenterViewRenderedAndroid ? (<react_native_screens_1.ScreenStackHeaderCenterView>
              {typeof headerTitle === 'function' ? (headerTitleElement) : (<elements_1.HeaderTitle tintColor={tintColor} style={headerTitleStyleSupported}>
                  {titleText}
                </elements_1.HeaderTitle>)}
            </react_native_screens_1.ScreenStackHeaderCenterView>) : null}
        </>)}
      {react_native_1.Platform.OS === 'ios' && rightItems ? (rightItems.map((item, index) => {
            if (item.type === 'custom') {
                return (<react_native_screens_1.ScreenStackHeaderRightView key={index} hidesSharedBackground={item.hidesSharedBackground}>
                {item.element}
              </react_native_screens_1.ScreenStackHeaderRightView>);
            }
            return null;
        })) : headerRightElement != null ? (<react_native_screens_1.ScreenStackHeaderRightView>{headerRightElement}</react_native_screens_1.ScreenStackHeaderRightView>) : null}
      {hasHeaderSearchBar ? (<react_native_screens_1.ScreenStackHeaderSearchBarView>
          <react_native_screens_1.SearchBar {...headerSearchBarOptions}/>
        </react_native_screens_1.ScreenStackHeaderSearchBarView>) : null}
    </>);
    return {
        backgroundColor: headerBackgroundColor,
        blurEffect: headerBlurEffect,
        color: tintColor,
        direction,
        hidden: headerShown === false,
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
//# sourceMappingURL=useHeaderConfig.js.map