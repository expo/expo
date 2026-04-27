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
const elements_1 = require("./common/elements");
const types_1 = require("./types");
const native_1 = require("../react-navigation/native");
const bottomAccessory_1 = require("./utils/bottomAccessory");
const icon_1 = require("./utils/icon");
const children_1 = require("../utils/children");
// TODO(@ubax): add per platform implementations splitted into .platform files
function NativeTabsView(props) {
    const { minimizeBehavior, disableIndicator, focusedIndex, provenance, tabs, sidebarAdaptable, nonTriggerChildren, } = props;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    // We need to check if the deferred index is not out of bounds
    // This can happen when the focused index is the last tab, and user removes that tab
    // In that case the deferred index will still point to the last tab, but after re-render
    // it will be out of bounds
    const inBoundsDeferredFocusedIndex = deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;
    const selectedScreenKey = tabs[inBoundsDeferredFocusedIndex].routeKey;
    const iosAppearances = tabs.map((tab) => process.env.EXPO_OS !== 'ios'
        ? undefined
        : {
            standardAppearance: (0, appearance_1.createStandardAppearanceFromOptions)(tab.options),
            scrollEdgeAppearance: (0, appearance_1.createScrollEdgeAppearanceFromOptions)(tab.options),
        });
    const androidAppearances = tabs.map((tab) => process.env.EXPO_OS !== 'android'
        ? undefined
        : (0, appearance_1.createAndroidScreenAppearance)({
            options: tab.options,
            tintColor: props.tintColor,
            rippleColor: props.rippleColor,
            disableIndicator,
            labelVisibilityMode,
        }));
    const bottomAccessory = (0, react_1.useMemo)(() => (0, children_1.getFirstChildOfType)(nonTriggerChildren, elements_1.NativeTabsBottomAccessory), [nonTriggerChildren]);
    const bottomAccessoryFn = (0, bottomAccessory_1.useBottomAccessoryFunctionFromBottomAccessories)(bottomAccessory);
    // TODO(@ubax): add per screen labelVisibilityMode + validation function
    let labelVisibilityMode = props.labelVisibilityMode;
    if (labelVisibilityMode && !supportedTabBarItemLabelVisibilityModesSet.has(labelVisibilityMode)) {
        console.warn(`Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`);
        labelVisibilityMode = undefined;
    }
    const children = tabs.map((tab, index) => ((0, jsx_runtime_1.jsx)(Screen, { routeKey: tab.routeKey, name: tab.name, options: tab.options, isFocused: selectedScreenKey === tab.routeKey, standardAppearance: iosAppearances[index]?.standardAppearance, scrollEdgeAppearance: iosAppearances[index]?.scrollEdgeAppearance, androidAppearance: androidAppearances[index], contentRenderer: tab.contentRenderer }, tab.routeKey)));
    if (children.length === 0) {
        return null;
    }
    const tabBarControllerMode = sidebarAdaptable ? 'tabSidebar' : sidebarAdaptable === false ? 'tabBar' : 'automatic';
    return ((0, jsx_runtime_1.jsx)(TabsHostWrapper, { navState: { selectedScreenKey, provenance }, ios: {
            tabBarTintColor: props.tintColor,
            tabBarMinimizeBehavior: minimizeBehavior,
            tabBarControllerMode,
            bottomAccessory: bottomAccessoryFn,
        }, 
        // TODO(@ubax): Adjust docs and add support for tabBarRespectsIMEInsets
        android: {}, tabBarHidden: props.hidden, onTabSelected: ({ nativeEvent: { selectedScreenKey, provenance: nextProvenance } }) => {
            props.onTabChange({ selectedKey: selectedScreenKey, provenance: nextProvenance });
        }, children: children }));
}
function Screen(props) {
    const { routeKey, name, options, 
    // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
    isFocused, standardAppearance, scrollEdgeAppearance, androidAppearance, contentRenderer, } = props;
    const title = options.title ?? name;
    // We need to await the icon, as VectorIcon will load asynchronously
    const icon = (0, icon_1.useAwaitedScreensIcon)(options.icon);
    const selectedIcon = (0, icon_1.useAwaitedScreensIcon)(options.selectedIcon);
    const { colors } = (0, native_1.useTheme)();
    const iosIcon = (0, icon_1.convertOptionsIconToIOSPropsIcon)(icon, standardAppearance?.stacked?.normal?.tabBarItemIconColor);
    const iosSelectedIcon = (0, icon_1.convertOptionsIconToIOSPropsIcon)(selectedIcon, standardAppearance?.stacked?.selected?.tabBarItemIconColor);
    const androidIcon = icon ? (0, icon_1.convertOptionsIconToAndroidPropsIcon)(icon) : undefined;
    const androidSelectedIcon = selectedIcon
        ? (0, icon_1.convertOptionsIconToAndroidPropsIcon)(selectedIcon)
        : undefined;
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
    const { ios: nativeIosOverrides, android: nativeAndroidOverrides, ...nativeRestOverrides } = options.nativeProps ?? {};
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Screen, { ...options, 
        // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
        pointerEvents: isFocused ? 'box-none' : 'none', ios: {
            icon: iosIcon,
            selectedIcon: iosSelectedIcon,
            standardAppearance,
            scrollEdgeAppearance,
            systemItem: options.role,
            overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets,
            ...nativeIosOverrides,
        }, android: {
            icon: androidIcon,
            selectedIcon: androidSelectedIcon,
            standardAppearance: androidAppearance,
            ...nativeAndroidOverrides,
        }, title: title, ...nativeRestOverrides, screenKey: routeKey, children: wrappedContent }));
}
const supportedTabBarMinimizeBehaviorsSet = new Set(types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set(types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES);
function TabsHostWrapper(props) {
    // TODO(@ubax): add function for validation
    let validatedIos = props.ios;
    if (validatedIos?.tabBarMinimizeBehavior) {
        if (!supportedTabBarMinimizeBehaviorsSet.has(validatedIos.tabBarMinimizeBehavior)) {
            console.warn(`Unsupported minimizeBehavior: ${validatedIos.tabBarMinimizeBehavior}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`);
            validatedIos = { ...validatedIos, tabBarMinimizeBehavior: undefined };
        }
    }
    return (0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Host, { ...props, ios: validatedIos });
}
//# sourceMappingURL=NativeTabsView.js.map