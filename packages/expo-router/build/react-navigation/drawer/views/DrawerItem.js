"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerItem = DrawerItem;
const React = __importStar(require("react"));
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
        : (inactiveTintColor ?? (0, color_1.Color)(colors.text)?.alpha(0.68).string() ?? 'rgba(0, 0, 0, 0.68)');
    const backgroundColor = focused
        ? (activeBackgroundColor ??
            (0, color_1.Color)(activeTintColor)?.alpha(0.12).string() ??
            'rgba(0, 0, 0, 0.12)')
        : inactiveBackgroundColor;
    const iconNode = icon ? icon({ size: 24, focused, color }) : null;
    return (<react_native_1.View collapsable={false} {...rest} style={[styles.container, { borderRadius, backgroundColor }, style]}>
      <elements_1.PlatformPressable testID={testID} onPress={onPress} role="button" aria-label={accessibilityLabel} aria-selected={focused} pressColor={pressColor} pressOpacity={pressOpacity} hoverEffect={{ color }} href={href}>
        <react_native_1.View style={[styles.wrapper, { borderRadius }]}>
          {iconNode}
          <react_native_1.View style={[styles.label, { marginStart: iconNode ? 12 : 0 }]}>
            {typeof label === 'string' ? (<elements_1.Text numberOfLines={1} allowFontScaling={allowFontScaling} style={[styles.labelText, { color }, fonts.medium, labelStyle]}>
                {label}
              </elements_1.Text>) : (label({ color, focused }))}
          </react_native_1.View>
        </react_native_1.View>
      </elements_1.PlatformPressable>
    </react_native_1.View>);
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