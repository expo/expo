"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSavingView = ResourceSavingView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const FAR_FAR_AWAY = 30000; // this should be big enough to move the whole view out of its container
function ResourceSavingView({ visible, children, style, ...rest }) {
    if (react_native_1.Platform.OS === 'web') {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View
        // @ts-expect-error: hidden exists on web, but not in React Native
        , { 
            // @ts-expect-error: hidden exists on web, but not in React Native
            hidden: !visible, style: [
                { pointerEvents: visible ? 'auto' : 'none', display: visible ? 'flex' : 'none' },
                styles.container,
                style,
            ], ...rest, children: children }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
            // box-none doesn't seem to work properly on Android
            { pointerEvents: visible ? 'auto' : 'none' },
            styles.container,
            style,
        ], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { collapsable: false, removeClippedSubviews: 
            // On iOS & macOS, set removeClippedSubviews to true only when not focused
            // This is an workaround for a bug where the clipped view never re-appears
            react_native_1.Platform.OS === 'ios' || react_native_1.Platform.OS === 'macos' ? !visible : true, style: [
                { pointerEvents: visible ? 'auto' : 'none' },
                visible ? styles.attached : styles.detached,
            ], children: children }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    attached: {
        flex: 1,
    },
    detached: {
        flex: 1,
        top: FAR_FAR_AWAY,
    },
});
//# sourceMappingURL=ResourceSavingView.js.map