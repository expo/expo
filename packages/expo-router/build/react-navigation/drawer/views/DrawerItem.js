"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerItem = DrawerItem;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const color_1 = require("../../../utils/color");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
function DrawerItem(props) {
    const { colors, fonts } = (0, native_1.useTheme)();
    const { href, icon, label, labelStyle, focused = false, allowFontScaling, activeTintColor = colors.primary, inactiveTintColor, activeBackgroundColor, inactiveBackgroundColor = 'transparent', style, onPress, pressColor, pressOpacity = 1, testID, accessibilityLabel, ...rest } = props;
    const { borderRadius = 56 } = react_native_1.StyleSheet.flatten(style || {});
    const color = focused
        ? activeTintColor
        : (inactiveTintColor ?? (0, color_1.Color)(colors.text)?.alpha(0.68).string() ?? colors.text);
    const backgroundColor = focused
        ? (activeBackgroundColor ?? (0, color_1.Color)(activeTintColor)?.alpha(0.12).string() ?? 'transparent')
        : inactiveBackgroundColor;
    const iconNode = icon ? icon({ size: 24, focused, color }) : null;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { collapsable: false, ...rest, style: [styles.container, { borderRadius, backgroundColor }, style], children: (0, jsx_runtime_1.jsx)(elements_1.PlatformPressable, { testID: testID, onPress: onPress, role: "button", "aria-label": accessibilityLabel, "aria-selected": focused, pressColor: pressColor, pressOpacity: pressOpacity, hoverEffect: { color }, href: href, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.wrapper, { borderRadius }], children: [iconNode, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.label, { marginStart: iconNode ? 12 : 0 }], children: typeof label === 'string' ? ((0, jsx_runtime_1.jsx)(elements_1.Text, { numberOfLines: 1, allowFontScaling: allowFontScaling, style: [styles.labelText, { color }, fonts.medium, labelStyle], children: label })) : (label({ color, focused })) })] }) }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        borderCurve: 'continuous',
        overflow: 'hidden',
    },
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingStart: 16,
        paddingEnd: 24,
        borderCurve: 'continuous',
    },
    label: {
        marginEnd: 12,
        marginVertical: 4,
        flex: 1,
    },
    labelText: {
        lineHeight: 24,
        textAlignVertical: 'center',
    },
});
//# sourceMappingURL=DrawerItem.js.map