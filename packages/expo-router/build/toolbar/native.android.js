"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
const jsx_runtime_1 = require("react/jsx-runtime");
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
function RouterToolbarHost(props) {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const modifiers = (0, react_1.useMemo)(() => {
        const baseModifiers = [(0, modifiers_1.fillMaxWidth)(), (0, modifiers_1.padding)(0, 0, 0, insets.bottom)];
        if (props.withImePadding) {
            baseModifiers.push((0, modifiers_1.imePadding)());
        }
        return baseModifiers;
    }, [insets.bottom, props.withImePadding]);
    // The wrapper fills the screen so it can pin the toolbar to the bottom, but `box-none` keeps it
    // from being a touch target. The Compose `Host` then wraps just the toolbar (matchContents), so
    // only that area swallows touches — taps elsewhere reach the screen content below (ENG-22124).
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: "RouterToolbarWrapper", style: styles.container, pointerEvents: "box-none", children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Host, { matchContents: { vertical: true }, style: styles.host, children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Box, { modifiers: modifiers, contentAlignment: "center", children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.HorizontalFloatingToolbar, { colors: {
                        ...(props.backgroundColor ? { toolbarContainerColor: props.backgroundColor } : {}),
                    }, modifiers: [(0, modifiers_1.height)(64)], children: props.children }) }) }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: { ...react_native_1.StyleSheet.absoluteFill, justifyContent: 'flex-end' },
    host: { width: '100%', paddingHorizontal: 24 },
});
//# sourceMappingURL=native.android.js.map