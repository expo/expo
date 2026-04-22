"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerContentScrollView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const native_1 = require("../../native");
const DrawerPositionContext_1 = require("../utils/DrawerPositionContext");
const SPACING = 12;
function DrawerContentScrollViewInner({ ref, contentContainerStyle, style, children, ...rest }) {
    const drawerPosition = (0, react_1.use)(DrawerPositionContext_1.DrawerPositionContext);
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { direction } = (0, native_1.useLocale)();
    const isRight = direction === 'rtl' ? drawerPosition === 'left' : drawerPosition === 'right';
    return ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { ...rest, ref: ref, contentContainerStyle: [
            {
                paddingTop: SPACING + insets.top,
                paddingBottom: SPACING + insets.bottom,
                paddingStart: SPACING + (!isRight ? insets.left : 0),
                paddingEnd: SPACING + (isRight ? insets.right : 0),
            },
            contentContainerStyle,
        ], style: [styles.container, style], children: children }));
}
exports.DrawerContentScrollView = DrawerContentScrollViewInner;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
});
//# sourceMappingURL=DrawerContentScrollView.js.map