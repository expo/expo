"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const color_1 = __importDefault(require("color"));
const react_native_1 = require("react-native");
const native_1 = require("../native");
const PlatformPressable_1 = require("./PlatformPressable");
const Text_1 = require("./Text");
const BUTTON_RADIUS = 40;
function Button(props) {
    if ('screen' in props || 'action' in props) {
        // @ts-expect-error: This is already type-checked by the prop types
        return (0, jsx_runtime_1.jsx)(ButtonLink, { ...props });
    }
    else {
        return (0, jsx_runtime_1.jsx)(ButtonBase, { ...props });
    }
}
function ButtonLink({ screen, params, action, href, ...rest }) {
    // @ts-expect-error: This is already type-checked by the prop types
    const props = (0, native_1.useLinkProps)({ screen, params, action, href });
    return (0, jsx_runtime_1.jsx)(ButtonBase, { ...rest, ...props });
}
function ButtonBase({ variant = 'tinted', color: customColor, android_ripple, style, children, ...rest }) {
    const { colors, fonts } = (0, native_1.useTheme)();
    const color = customColor ?? colors.primary;
    let backgroundColor;
    let textColor;
    switch (variant) {
        case 'plain':
            backgroundColor = 'transparent';
            textColor = color;
            break;
        case 'tinted':
            backgroundColor = (0, color_1.default)(color).fade(0.85).string();
            textColor = color;
            break;
        case 'filled':
            backgroundColor = color;
            textColor = (0, color_1.default)(color).isDark() ? 'white' : (0, color_1.default)(color).darken(0.71).string();
            break;
    }
    return ((0, jsx_runtime_1.jsx)(PlatformPressable_1.PlatformPressable, { ...rest, android_ripple: {
            radius: BUTTON_RADIUS,
            color: (0, color_1.default)(textColor).fade(0.85).string(),
            ...android_ripple,
        }, pressOpacity: react_native_1.Platform.OS === 'ios' ? undefined : 1, hoverEffect: { color: textColor }, style: [{ backgroundColor }, styles.button, style], children: (0, jsx_runtime_1.jsx)(Text_1.Text, { style: [{ color: textColor }, fonts.regular, styles.text], children: children }) }));
}
const styles = react_native_1.StyleSheet.create({
    button: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: BUTTON_RADIUS,
        borderCurve: 'continuous',
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.1,
        textAlign: 'center',
    },
});
//# sourceMappingURL=Button.js.map