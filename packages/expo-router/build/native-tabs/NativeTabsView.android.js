"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_screens_1 = require("react-native-screens");
const experimental_1 = require("react-native-screens/experimental");
const NativeTabsView_shared_1 = require("./NativeTabsView.shared");
const appearance_1 = require("./appearance");
const types_1 = require("./types");
const optionsIconConverter_1 = require("./utils/optionsIconConverter");
function NativeTabsView(props) {
    const { disableIndicator, tabBarRespectsIMEInsets, tabs, unstable_nativeProps } = props;
    const { android: rawAndroidProps, ios: _ignoredRawIosProps, ...rawHostRestProps } = unstable_nativeProps ?? {};
    const { selectedScreenKey, provenance } = (0, NativeTabsView_shared_1.useSelectedScreenKey)(props);
    const onTabSelected = (0, NativeTabsView_shared_1.useOnTabSelectedHandler)(props.onTabChange);
    // TODO(@ubax): add per screen labelVisibilityMode + validation function
    let labelVisibilityMode = props.labelVisibilityMode;
    if (labelVisibilityMode && !supportedTabBarItemLabelVisibilityModesSet.has(labelVisibilityMode)) {
        console.warn(`Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`);
        labelVisibilityMode = undefined;
    }
    const androidAppearances = tabs.map((tab) => (0, appearance_1.createAndroidScreenAppearance)({
        options: tab.options,
        tintColor: props.tintColor,
        rippleColor: props.rippleColor,
        disableIndicator,
        labelVisibilityMode,
    }));
    const children = tabs.map((tab, index) => ((0, jsx_runtime_1.jsx)(Screen, { routeKey: tab.routeKey, name: tab.name, options: tab.options, isFocused: selectedScreenKey === tab.routeKey, androidAppearance: androidAppearances[index], contentRenderer: tab.contentRenderer }, tab.routeKey)));
    if (children.length === 0) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Host, { android: {
            tabBarRespectsIMEInsets: !!tabBarRespectsIMEInsets,
            ...rawAndroidProps,
        }, tabBarHidden: props.hidden, ...rawHostRestProps, navStateRequest: { selectedScreenKey, baseProvenance: provenance }, onTabSelected: onTabSelected, children: children }));
}
function Screen(props) {
    const { options, androidAppearance, contentRenderer } = props;
    const shared = (0, NativeTabsView_shared_1.useSharedScreenProps)(props);
    const androidIcon = (0, optionsIconConverter_1.convertOptionsIconToScreensPropsIcon)(shared.icon);
    const androidSelectedIcon = (0, optionsIconConverter_1.convertOptionsIconToScreensPropsIcon)(shared.selectedIcon);
    const content = (0, jsx_runtime_1.jsx)(NativeTabsView_shared_1.ScreenContent, { options: options, contentRenderer: contentRenderer });
    const wrappedContent = (0, react_1.useMemo)(() => {
        if (!options.disableAutomaticContentInsets) {
            return ((0, jsx_runtime_1.jsx)(experimental_1.SafeAreaView
            // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
            , { 
                // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
                collapsable: false, style: { flex: 1 }, edges: { bottom: true }, children: content }));
        }
        return content;
    }, [content, options.disableAutomaticContentInsets]);
    return ((0, jsx_runtime_1.jsx)(react_native_screens_1.Tabs.Screen, { ...shared.options, pointerEvents: shared.pointerEvents, android: {
            icon: androidIcon,
            selectedIcon: androidSelectedIcon,
            standardAppearance: androidAppearance,
            ...shared.nativeAndroidOverrides,
        }, title: shared.title, preventNativeSelection: options.disabled, ...shared.nativeRestOverrides, screenKey: shared.screenKey, children: wrappedContent }));
}
const supportedTabBarItemLabelVisibilityModesSet = new Set(types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES);
//# sourceMappingURL=NativeTabsView.android.js.map