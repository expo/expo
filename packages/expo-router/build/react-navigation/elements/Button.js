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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const color_1 = __importDefault(require("color"));
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const native_1 = require("../native");
const PlatformPressable_1 = require("./PlatformPressable");
const Text_1 = require("./Text");
const BUTTON_RADIUS = 40;
function Button(props) {
    if ('screen' in props || 'action' in props) {
        // @ts-expect-error: This is already type-checked by the prop types
        return <ButtonLink {...props}/>;
    }
    else {
        return <ButtonBase {...props}/>;
    }
}
function ButtonLink({ screen, params, action, href, ...rest }) {
    // @ts-expect-error: This is already type-checked by the prop types
    const props = (0, native_1.useLinkProps)({ screen, params, action, href });
    return <ButtonBase {...rest} {...props}/>;
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
    return (<PlatformPressable_1.PlatformPressable {...rest} android_ripple={{
            radius: BUTTON_RADIUS,
            color: (0, color_1.default)(textColor).fade(0.85).string(),
            ...android_ripple,
        }} pressOpacity={react_native_1.Platform.OS === 'ios' ? undefined : 1} hoverEffect={{ color: textColor }} style={[{ backgroundColor }, styles.button, style]}>
      <Text_1.Text style={[{ color: textColor }, fonts.regular, styles.text]}>{children}</Text_1.Text>
    </PlatformPressable_1.PlatformPressable>);
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