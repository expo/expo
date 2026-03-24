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
exports.PlatformPressable = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const native_1 = require("../native");
const AnimatedPressable = react_native_1.Animated.createAnimatedComponent(react_native_1.Pressable);
const ANDROID_VERSION_LOLLIPOP = 21;
const ANDROID_SUPPORTS_RIPPLE = react_native_1.Platform.OS === 'android' && react_native_1.Platform.Version >= ANDROID_VERSION_LOLLIPOP;
const useNativeDriver = react_native_1.Platform.OS !== 'web';
/**
 * PlatformPressable provides an abstraction on top of Pressable to handle platform differences.
 */
function PlatformPressableInternal({ disabled, onPress, onPressIn, onPressOut, android_ripple, pressColor, pressOpacity = 0.3, hoverEffect, style, children, ...rest }, ref) {
    const { dark } = (0, native_1.useTheme)();
    const [opacity] = React.useState(() => new react_native_1.Animated.Value(1));
    const animateTo = (toValue, duration) => {
        if (ANDROID_SUPPORTS_RIPPLE) {
            return;
        }
        react_native_1.Animated.timing(opacity, {
            toValue,
            duration,
            easing: react_native_1.Easing.inOut(react_native_1.Easing.quad),
            useNativeDriver,
        }).start();
    };
    const handlePress = (e) => {
        if (react_native_1.Platform.OS === 'web' && rest.href !== null) {
            // ignore clicks with modifier keys
            const hasModifierKey = ('metaKey' in e && e.metaKey) ||
                ('altKey' in e && e.altKey) ||
                ('ctrlKey' in e && e.ctrlKey) ||
                ('shiftKey' in e && e.shiftKey);
            // only handle left clicks
            const isLeftClick = 'button' in e ? e.button == null || e.button === 0 : true;
            // let browser handle "target=_blank" etc.
            const isSelfTarget = e.currentTarget && 'target' in e.currentTarget
                ? [undefined, null, '', 'self'].includes(e.currentTarget.target)
                : true;
            if (!hasModifierKey && isLeftClick && isSelfTarget) {
                e.preventDefault();
                // call `onPress` only when browser default is prevented
                // this prevents app from handling the click when a link is being opened
                onPress?.(e);
            }
        }
        else {
            onPress?.(e);
        }
    };
    const handlePressIn = (e) => {
        animateTo(pressOpacity, 0);
        onPressIn?.(e);
    };
    const handlePressOut = (e) => {
        animateTo(1, 200);
        onPressOut?.(e);
    };
    return (<AnimatedPressable ref={ref} accessible role={react_native_1.Platform.OS === 'web' && rest.href != null ? 'link' : 'button'} onPress={disabled ? undefined : handlePress} onPressIn={disabled ? undefined : handlePressIn} onPressOut={disabled ? undefined : handlePressOut} android_ripple={ANDROID_SUPPORTS_RIPPLE && !disabled
            ? {
                color: pressColor !== undefined
                    ? pressColor
                    : dark
                        ? 'rgba(255, 255, 255, .32)'
                        : 'rgba(0, 0, 0, .32)',
                ...android_ripple,
            }
            : undefined} style={[
            {
                cursor: (react_native_1.Platform.OS === 'web' || react_native_1.Platform.OS === 'ios') && !disabled
                    ? // Pointer cursor on web
                        // Hover effect on iPad and visionOS
                        'pointer'
                    : 'auto',
                opacity: !ANDROID_SUPPORTS_RIPPLE && !disabled ? opacity : 1,
            },
            style,
        ]} {...rest}>
      {!disabled ? <HoverEffect {...hoverEffect}/> : null}
      {children}
    </AnimatedPressable>);
}
exports.PlatformPressable = React.forwardRef(PlatformPressableInternal);
exports.PlatformPressable.displayName = 'PlatformPressable';
const css = String.raw;
const CLASS_NAME = `__react-navigation_elements_Pressable_hover`;
const CSS_TEXT = css `
  .${CLASS_NAME} {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    background-color: var(--overlay-color);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  a:hover > .${CLASS_NAME}, button:hover > .${CLASS_NAME} {
    opacity: var(--overlay-hover-opacity);
  }

  a:active > .${CLASS_NAME}, button:active > .${CLASS_NAME} {
    opacity: var(--overlay-active-opacity);
  }
`;
const HoverEffect = ({ color, hoverOpacity = 0.08, activeOpacity = 0.16 }) => {
    if (react_native_1.Platform.OS !== 'web' || color == null) {
        return null;
    }
    return (<>
      <style href={CLASS_NAME} precedence="elements">
        {CSS_TEXT}
      </style>
      <div className={CLASS_NAME} style={{
            // @ts-expect-error: CSS variables are not typed
            '--overlay-color': color,
            '--overlay-hover-opacity': hoverOpacity,
            '--overlay-active-opacity': activeOpacity,
        }}/>
    </>);
};
//# sourceMappingURL=PlatformPressable.js.map