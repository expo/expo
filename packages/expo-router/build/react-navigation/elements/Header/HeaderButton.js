"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const PlatformPressable_1 = require("../PlatformPressable");
function HeaderButtonInternal({ ref, disabled, onPress, pressColor, pressOpacity, accessibilityLabel, testID, style, href, children, }) {
    return ((0, jsx_runtime_1.jsx)(PlatformPressable_1.PlatformPressable, { ref: ref, disabled: disabled, href: href, "aria-label": accessibilityLabel, testID: testID, onPress: onPress, pressColor: pressColor, pressOpacity: pressOpacity, android_ripple: androidRipple, style: [styles.container, disabled && styles.disabled, style], hitSlop: react_native_1.Platform.select({
            ios: undefined,
            default: { top: 16, right: 16, bottom: 16, left: 16 },
        }), children: children }));
}
exports.HeaderButton = HeaderButtonInternal;
const androidRipple = {
    borderless: true,
    foreground: react_native_1.Platform.OS === 'android' && react_native_1.Platform.Version >= 23,
    radius: 20,
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        // Roundness for iPad hover effect
        borderRadius: 10,
        borderCurve: 'continuous',
    },
    disabled: {
        opacity: 0.5,
    },
});
//# sourceMappingURL=HeaderButton.js.map