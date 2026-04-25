"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Background = Background;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const native_1 = require("../native");
function Background({ style, ...rest }) {
    const { colors } = (0, native_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { ...rest, style: [{ flex: 1, backgroundColor: colors.background }, style] }));
}
//# sourceMappingURL=Background.js.map