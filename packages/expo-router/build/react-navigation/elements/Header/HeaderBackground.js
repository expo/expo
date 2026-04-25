"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderBackground = HeaderBackground;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const native_1 = require("../../native");
function HeaderBackground({ style, ...rest }) {
    const { colors, dark } = (0, native_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
            styles.container,
            {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
                ...(react_native_1.Platform.OS === 'ios' && {
                    shadowColor: dark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 1)',
                }),
            },
            style,
        ], ...rest }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        ...react_native_1.Platform.select({
            android: {
                elevation: 4,
            },
            ios: {
                shadowOpacity: 0.3,
                shadowRadius: 0,
                shadowOffset: {
                    width: 0,
                    height: react_native_1.StyleSheet.hairlineWidth,
                },
            },
            default: {
                borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            },
        }),
    },
});
//# sourceMappingURL=HeaderBackground.js.map