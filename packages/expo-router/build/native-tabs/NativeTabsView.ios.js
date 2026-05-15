"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
const NativeTabsView_shared_1 = require("./NativeTabsView.shared");
const appearance_1 = require("./appearance");
const elements_1 = require("./common/elements");
const types_1 = require("./types");
const bottomAccessory_1 = require("./utils/bottomAccessory");
const optionsIconConverter_1 = require("./utils/optionsIconConverter");
const children_1 = require("../utils/children");
function NativeTabsView(props) {
    const { minimizeBehavior, tabs, sidebarAdaptable, nonTriggerChildren, unstable_nativeProps } = props;
    // `ios`/`android` are the only platform-nested keys on `TabsHostProps`. We drop the inactive
    // platform's slice so users writing universal code don't pass Android-only props to the iOS host.
    const { ios: rawIosProps, android: _ignoredRawAndroidProps, ...rawHostRestProps } = unstable_nativeProps ?? {};
    const { selectedScreenKey, provenance } = (0, NativeTabsView_shared_1.useSelectedScreenKey)(props);
    const onTabSelected = (0, NativeTabsView_shared_1.useOnTabSelectedHandler)(props.onTabChange);
    const iosAppearances = tabs.map((tab) => ({
        standardAppearance: (0, appearance_1.createStandardAppearanceFromOptions)(tab.options),
        scrollEdgeAppearance: (0, appearance_1.createScrollEdgeAppearanceFromOptions)(tab.options),
    }));
    const bottomAccessory = (0, react_1.useMemo)(() => (0, children_1.getFirstChildOfType)(nonTriggerChildren, elements_1.NativeTabsBottomAccessory), [nonTriggerChildren]);
    const bottomAccessoryFn = (0, bottomAccessory_1.useBottomAccessoryFunctionFromBottomAccessories)(bottomAccessory);
    if (process.env.NODE_ENV !== 'production' &&
        bottomAccessory &&
        rawIosProps &&
        'bottomAccessory' in rawIosProps) {
        console.warn('<NativeTabs.BottomAccessory> is being overridden by `unstable_nativeProps.ios.bottomAccessory`. ' +
            'Either remove the `<NativeTabs.BottomAccessory>` child or stop passing `ios.bottomAccessory` via `unstable_nativeProps`.');
    }
    const children = tabs.map((tab, index) => ((0, jsx_runtime_1.jsx)(Screen, { routeKey: tab.routeKey, name: tab.name, options: tab.options, isFocused: selectedScreenKey === tab.routeKey, standardAppearance: iosAppearances[index].standardAppearance, scrollEdgeAppearance: iosAppearances[index].scrollEdgeAppearance, contentRenderer: tab.contentRenderer }, tab.routeKey)));
    if (children.length === 0) {
        return null;
    }
    const tabBarControllerMode = sidebarAdaptable ? 'tabSidebar' : sidebarAdaptable === false ? 'tabBar' : 'automatic';
    return ((0, jsx_runtime_1.jsx)(TabsHostWrapper, { ios: {
            tabBarTintColor: props.tintColor,
            tabBarMinimizeBehavior: minimizeBehavior,
            tabBarControllerMode,
            bottomAccessory: bottomAccessoryFn,
            ...rawIosProps,
        }, tabBarHidden: props.hidden, ...rawHostRestProps, navStateRequest: { selectedScreenKey, baseProvenance: provenance }, onTabSelected: onTabSelected, children: children }));
}
function Screen(props) {
    const { options, standardAppearance, scrollEdgeAppearance, contentRenderer } = props;
    const shared = (0, NativeTabsView_shared_1.useSharedScreenProps)(props);
    const iosIcon = (0, optionsIconConverter_1.convertOptionsIconToScreensPropsIcon)(shared.icon, standardAppearance?.stacked?.normal?.tabBarItemIconColor);
    const iosSelectedIcon = (0, optionsIconConverter_1.convertOptionsIconToScreensPropsIcon)(shared.selectedIcon, standardAppearance?.stacked?.selected?.tabBarItemIconColor);
    const content = (0, jsx_runtime_1.jsx)(NativeTabsView_shared_1.ScreenContent, { options: options, contentRenderer: contentRenderer });
    const wrappedContent = (0, react_1.useMemo)(() => (0, jsx_runtime_1.jsx)(react_native_safe_area_context_1.SafeAreaProvider, { children: content }), [content]);
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Screen, { ...shared.options, pointerEvents: shared.pointerEvents, ios: {
            icon: iosIcon,
            selectedIcon: iosSelectedIcon,
            standardAppearance,
            scrollEdgeAppearance,
            systemItem: options.role,
            overrideScrollViewContentInsetAdjustmentBehavior: !options.disableAutomaticContentInsets,
            ...shared.nativeIosOverrides,
        }, title: shared.title, preventNativeSelection: options.disabled, ...shared.nativeRestOverrides, screenKey: shared.screenKey, children: wrappedContent }));
}
const supportedTabBarMinimizeBehaviorsSet = new Set(types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
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
//# sourceMappingURL=NativeTabsView.ios.js.map