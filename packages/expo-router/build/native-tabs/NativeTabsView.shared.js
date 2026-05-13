"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelectedScreenKey = useSelectedScreenKey;
exports.useOnTabSelectedHandler = useOnTabSelectedHandler;
exports.useSharedScreenProps = useSharedScreenProps;
exports.ScreenContent = ScreenContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const icon_1 = require("./utils/icon");
const native_1 = require("../react-navigation/native");
function useSelectedScreenKey({ focusedIndex, provenance, tabs, }) {
    const stableState = (0, react_1.useMemo)(() => ({ focusedIndex, provenance }), [focusedIndex, provenance]);
    const { focusedIndex: deferredFocusedIndex, provenance: deferredProvenance } = (0, react_1.useDeferredValue)(stableState);
    // We need to check if the deferred index is not out of bounds
    // This can happen when the focused index is the last tab, and user removes that tab
    // In that case the deferred index will still point to the last tab, but after re-render
    // it will be out of bounds
    const inBoundsDeferredFocusedIndex = deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;
    return {
        selectedScreenKey: tabs[inBoundsDeferredFocusedIndex].routeKey,
        provenance: deferredProvenance,
    };
}
function useOnTabSelectedHandler(onTabChange) {
    return (0, react_1.useCallback)(({ nativeEvent: { selectedScreenKey, provenance, actionOrigin } }) => {
        // Treat anything other than a JS-driven echo as a native action so the
        // navigator emits `tabPress` and dispatches `JUMP_TO`.
        const isNativeAction = actionOrigin !== 'programmatic-js';
        onTabChange({ selectedKey: selectedScreenKey, provenance, isNativeAction });
    }, [onTabChange]);
}
function useSharedScreenProps(props) {
    const { options, isFocused, name, routeKey } = props;
    const title = options.title ?? name;
    const { ios: nativeIosOverrides, android: nativeAndroidOverrides, ...nativeRestOverrides } = options.nativeProps ?? {};
    // We need to await the icon, as VectorIcon will load asynchronously
    const icon = (0, icon_1.useAwaitedScreensIcon)(options.icon);
    const selectedIcon = (0, icon_1.useAwaitedScreensIcon)(options.selectedIcon);
    return {
        options,
        // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
        pointerEvents: (isFocused ? 'box-none' : 'none'),
        title,
        nativeIosOverrides,
        nativeAndroidOverrides,
        nativeRestOverrides,
        screenKey: routeKey,
        icon,
        selectedIcon,
    };
}
function ScreenContent({ options, contentRenderer, }) {
    const { colors } = (0, native_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View
    // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
    , { 
        // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
        collapsable: false, style: [
            { backgroundColor: colors.background },
            options.contentStyle,
            { flex: 1, position: 'relative', overflow: 'hidden' },
        ], children: contentRenderer() }));
}
//# sourceMappingURL=NativeTabsView.shared.js.map