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
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [react_native_1.StyleSheet.absoluteFill], pointerEvents: "box-none", children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Host, { style: styles.host, children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Box, { modifiers: modifiers, contentAlignment: "bottomCenter", children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.HorizontalFloatingToolbar
                // TODO: use toolbarContainerColor
                // TODO: expose toolbarContainerColor from expo-ui
                , { 
                    // TODO: use toolbarContainerColor
                    // TODO: expose toolbarContainerColor from expo-ui
                    modifiers: [
                        (0, modifiers_1.height)(64),
                        ...(props.backgroundColor ? [(0, modifiers_1.background)(props.backgroundColor)] : []),
                    ], children: props.children }) }) }) }));
}
const styles = react_native_1.StyleSheet.create({
    host: { width: '100%', height: '100%', paddingHorizontal: 24 },
});
//# sourceMappingURL=native.android.js.map