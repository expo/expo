"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
const experimental_1 = require("react-native-screens/experimental");
const appearance_1 = require("./appearance");
const color_1 = require("../color");
const elements_1 = require("./common/elements");
const types_1 = require("./types");
const native_1 = require("../react-navigation/native");
const bottomAccessory_1 = require("./utils/bottomAccessory");
const icon_1 = require("./utils/icon");
const children_1 = require("../utils/children");
function NativeTabsView(props) {
    const { minimizeBehavior, disableIndicator, focusedIndex, tabs, sidebarAdaptable, nonTriggerChildren, } = props;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    // We need to check if the deferred index is not out of bounds
    // This can happen when the focused index is the last tab, and user removes that tab
    // In that case the deferred index will still point to the last tab, but after re-render
    // it will be out of bounds
    const inBoundsDeferredFocusedIndex = deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;
    const appearances = tabs.map((tab) => ({
        standardAppearance: (0, appearance_1.createStandardAppearanceFromOptions)(tab.options),
        scrollEdgeAppearance: (0, appearance_1.createScrollEdgeAppearanceFromOptions)(tab.options),
    }));
    const options = tabs.map((tab) => tab.options);
    const bottomAccessory = (0, react_1.useMemo)(() => (0, children_1.getFirstChildOfType)(nonTriggerChildren, elements_1.NativeTabsBottomAccessory), [nonTriggerChildren]);
    const bottomAccessoryFn = (0, bottomAccessory_1.useBottomAccessoryFunctionFromBottomAccessories)(bottomAccessory);
    const children = tabs.map((tab, index) => {
        const isFocused = index === inBoundsDeferredFocusedIndex;
        return ((0, jsx_runtime_1.jsx)(Screen, { routeKey: tab.routeKey, name: tab.name, options: tab.options, isFocused: isFocused, standardAppearance: appearances[index].standardAppearance, scrollEdgeAppearance: appearances[index].scrollEdgeAppearance, badgeTextColor: tab.options.badgeTextColor, contentRenderer: tab.contentRenderer }, tab.routeKey));
    });
    const currentTabAppearance = appearances[inBoundsDeferredFocusedIndex]?.standardAppearance;
    const tabBarControllerMode = sidebarAdaptable
        ? 'tabSidebar'
        : sidebarAdaptable === false
            ? 'tabBar'
            : 'automatic';
    // Material Design 3 dynamic color defaults for Android
    const androidMaterialDefaults = process.env.EXPO_OS === 'android'
        ? {
            inactiveColor: color_1.Color.android.dynamic.onSurfaceVariant,
            activeIconColor: color_1.Color.android.dynamic.onSecondaryContainer,
            activeLabelColor: color_1.Color.android.dynamic.onSurface,
            backgroundColor: color_1.Color.android.dynamic.surfaceContainer,
            rippleColor: color_1.Color.android.dynamic.primary,
            indicatorColor: color_1.Color.android.dynamic.secondaryContainer,
        }
        : undefined;
    return ((0, jsx_runtime_1.jsx)(TabsHostWrapper
    // #region android props
    , { 
        // #region android props
        tabBarItemTitleFontColor: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontColor ??
            androidMaterialDefaults?.inactiveColor, tabBarItemTitleFontFamily: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontFamily, tabBarItemTitleFontSize: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize, tabBarItemTitleFontSizeActive: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize, tabBarItemTitleFontWeight: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontWeight, tabBarItemTitleFontStyle: currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontStyle, tabBarItemIconColor: currentTabAppearance?.stacked?.normal?.tabBarItemIconColor ??
            androidMaterialDefaults?.inactiveColor, tabBarBackgroundColor: currentTabAppearance?.tabBarBackgroundColor ?? androidMaterialDefaults?.backgroundColor, tabBarItemRippleColor: props.rippleColor ?? androidMaterialDefaults?.rippleColor, tabBarItemLabelVisibilityMode: props.labelVisibilityMode, tabBarItemIconColorActive: currentTabAppearance?.stacked?.selected?.tabBarItemIconColor ??
            props?.tintColor ??
            androidMaterialDefaults?.activeIconColor, tabBarItemTitleFontColorActive: currentTabAppearance?.stacked?.selected?.tabBarItemTitleFontColor ??
            props?.tintColor ??
            androidMaterialDefaults?.activeLabelColor, 
        // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
        tabBarItemActiveIndicatorColor: options[inBoundsDeferredFocusedIndex]?.indicatorColor ??
            androidMaterialDefaults?.indicatorColor, tabBarItemActiveIndicatorEnabled: !disableIndicator, 
        // #endregion
        // #region iOS props
        tabBarTintColor: props?.tintColor, tabBarMinimizeBehavior: minimizeBehavior, tabBarControllerMode: tabBarControllerMode, bottomAccessory: bottomAccessoryFn, tabBarHidden: props.hidden, 
        // #endregion
        onNativeFocusChange: ({ nativeEvent: { tabKey } }) => {
            props.onTabChange(tabKey);
        }, children: children }));
}
function Screen(props) {
    const { routeKey, name, options, isFocused, standardAppearance, scrollEdgeAppearance, badgeTextColor, contentRenderer, } = props;
    const title = options.title ?? name;
    // We need to await the icon, as VectorIcon will load asynchronously
    const icon = (0, icon_1.useAwaitedScreensIcon)(options.icon);
    const selectedIcon = (0, icon_1.useAwaitedScreensIcon)(options.selectedIcon);
    const { colors } = (0, native_1.useTheme)();
    const content = ((0, jsx_runtime_1.jsx)(react_native_1.View
    // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
    , { 
        // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
        collapsable: false, style: [
            { backgroundColor: colors.background },
            options.contentStyle,
            { flex: 1, position: 'relative', overflow: 'hidden' },
        ], children: contentRenderer() }));
    const wrappedContent = (0, react_1.useMemo)(() => {
        if (process.env.EXPO_OS === 'android' && !options.disableAutomaticContentInsets) {
            return ((0, jsx_runtime_1.jsx)(experimental_1.SafeAreaView
            // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
            , { 
                // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
                collapsable: false, style: { flex: 1 }, edges: { bottom: true }, children: content }));
        }
        else if (process.env.EXPO_OS === 'ios') {
            return (0, jsx_runtime_1.jsx)(react_native_safe_area_context_1.SafeAreaProvider, { children: content });
        }
        else {
            return content;
        }
    }, [content, options.disableAutomaticContentInsets]);
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Screen, { ...options, 
        // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
        // @ts-expect-error pointerEvents are not exposed by react-native-screens, but still are passed down to native component
        pointerEvents: isFocused ? 'box-none' : 'none', overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets, tabBarItemBadgeBackgroundColor: standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor, tabBarItemBadgeTextColor: badgeTextColor, standardAppearance: standardAppearance, scrollEdgeAppearance: scrollEdgeAppearance, icon: (0, icon_1.convertOptionsIconToRNScreensPropsIcon)(icon, standardAppearance?.stacked?.normal?.tabBarItemIconColor), selectedIcon: (0, icon_1.convertOptionsIconToIOSPropsIcon)(selectedIcon, standardAppearance?.stacked?.selected?.tabBarItemIconColor), title: title, freezeContents: false, systemItem: options.role, ...options.nativeProps, tabKey: routeKey, isFocused: isFocused, children: wrappedContent }));
}
const supportedTabBarMinimizeBehaviorsSet = new Set(types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set(types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES);
function TabsHostWrapper(props) {
    let { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, ...rest } = props;
    if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
        console.warn(`Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`);
        tabBarMinimizeBehavior = undefined;
    }
    if (tabBarItemLabelVisibilityMode &&
        !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)) {
        console.warn(`Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`);
        tabBarItemLabelVisibilityMode = undefined;
    }
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Host, { tabBarItemLabelVisibilityMode: tabBarItemLabelVisibilityMode, tabBarMinimizeBehavior: tabBarMinimizeBehavior, ...rest }));
}
//# sourceMappingURL=NativeTabsView.js.map