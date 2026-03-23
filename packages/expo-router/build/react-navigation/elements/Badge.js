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
exports.Badge = Badge;
const color_1 = __importDefault(require("color"));
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const native_1 = require("../native");
const useNativeDriver = react_native_1.Platform.OS !== 'web';
function Badge({ children, style, visible = true, size = 18, ...rest }) {
    const [opacity] = React.useState(() => new react_native_1.Animated.Value(visible ? 1 : 0));
    const [rendered, setRendered] = React.useState(visible);
    const { colors, fonts } = (0, native_1.useTheme)();
    React.useEffect(() => {
        if (!rendered) {
            return;
        }
        react_native_1.Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 150,
            useNativeDriver,
        }).start(({ finished }) => {
            if (finished && !visible) {
                setRendered(false);
            }
        });
        return () => opacity.stopAnimation();
    }, [opacity, rendered, visible]);
    if (!rendered) {
        if (visible) {
            setRendered(true);
        }
        else {
            return null;
        }
    }
    // @ts-expect-error: backgroundColor definitely exists
    const { backgroundColor = colors.notification, ...restStyle } = react_native_1.StyleSheet.flatten(style) || {};
    const textColor = (0, color_1.default)(backgroundColor).isLight() ? 'black' : 'white';
    const borderRadius = size / 2;
    const fontSize = Math.floor((size * 3) / 4);
    return (<react_native_1.Animated.Text numberOfLines={1} style={[
            {
                transform: [
                    {
                        scale: opacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                        }),
                    },
                ],
                color: textColor,
                lineHeight: size - 1,
                height: size,
                minWidth: size,
                opacity,
                backgroundColor,
                fontSize,
                borderRadius,
                borderCurve: 'continuous',
            },
            fonts.regular,
            styles.container,
            restStyle,
        ]} {...rest}>
      {children}
    </react_native_1.Animated.Text>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        alignSelf: 'flex-end',
        textAlign: 'center',
        paddingHorizontal: 4,
        overflow: 'hidden',
    },
});
//# sourceMappingURL=Badge.js.map