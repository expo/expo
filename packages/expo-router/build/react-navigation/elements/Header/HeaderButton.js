"use strict";
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
exports.HeaderButton = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const PlatformPressable_1 = require("../PlatformPressable");
function HeaderButtonInternal({ disabled, onPress, pressColor, pressOpacity, accessibilityLabel, testID, style, href, children, }, ref) {
    return (<PlatformPressable_1.PlatformPressable ref={ref} disabled={disabled} href={href} aria-label={accessibilityLabel} testID={testID} onPress={onPress} pressColor={pressColor} pressOpacity={pressOpacity} android_ripple={androidRipple} style={[styles.container, disabled && styles.disabled, style]} hitSlop={react_native_1.Platform.select({
            ios: undefined,
            default: { top: 16, right: 16, bottom: 16, left: 16 },
        })}>
      {children}
    </PlatformPressable_1.PlatformPressable>);
}
exports.HeaderButton = React.forwardRef(HeaderButtonInternal);
exports.HeaderButton.displayName = 'HeaderButton';
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