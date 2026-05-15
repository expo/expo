"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_ui_1 = require("../optional-dependencies/expo-ui");
function RouterToolbarHost(props) {
    const { Host, HorizontalFloatingToolbar, Box } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar` bottom toolbar on Android');
    const { fillMaxWidth, height, padding, imePadding } = (0, expo_ui_1.getExpoUiJetpackComposeModifiers)('`Stack.Toolbar` bottom toolbar on Android');
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const modifiers = (0, react_1.useMemo)(() => {
        const baseModifiers = [fillMaxWidth(), padding(0, 0, 0, insets.bottom)];
        if (props.withImePadding) {
            baseModifiers.push(imePadding());
        }
        return baseModifiers;
    }, [insets.bottom, props.withImePadding]);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [react_native_1.StyleSheet.absoluteFill], pointerEvents: "box-none", children: (0, jsx_runtime_1.jsx)(Host, { style: styles.host, children: (0, jsx_runtime_1.jsx)(Box, { modifiers: modifiers, contentAlignment: "bottomCenter", children: (0, jsx_runtime_1.jsx)(HorizontalFloatingToolbar, { colors: {
                        ...(props.backgroundColor ? { toolbarContainerColor: props.backgroundColor } : {}),
                    }, modifiers: [height(64)], children: props.children }) }) }) }));
}
const styles = react_native_1.StyleSheet.create({
    host: { width: '100%', height: '100%', paddingHorizontal: 24 },
});
//# sourceMappingURL=native.android.js.map