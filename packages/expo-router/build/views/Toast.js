"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_FONT = void 0;
exports.ToastWrapper = ToastWrapper;
exports.Toast = Toast;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const bottom_tabs_1 = require("../react-navigation/bottom-tabs");
exports.CODE_FONT = react_native_1.Platform.select({
    default: 'Courier',
    ios: 'Courier New',
    android: 'monospace',
});
function useFadeIn() {
    // Returns a React Native Animated value for fading in
    const [value] = react_1.default.useState(() => new react_native_1.Animated.Value(0));
    react_1.default.useEffect(() => {
        react_native_1.Animated.timing(value, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, []);
    return value;
}
function ToastWrapper({ children }) {
    const inTabBar = react_1.default.use(bottom_tabs_1.BottomTabBarHeightContext);
    const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
    return ((0, jsx_runtime_1.jsx)(Wrapper, { collapsable: false, style: { flex: 1 }, children: children }));
}
function Toast({ children, filename, warning, }) {
    const filenamePretty = react_1.default.useMemo(() => {
        if (!filename)
            return undefined;
        return 'app' + filename.replace(/^\./, '');
    }, [filename]);
    const value = useFadeIn();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, children: (0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [
                styles.toast,
                {
                    position: react_native_1.Platform.select({
                        // NOTE(@kitten): This isn't typed to support Web properties
                        web: 'fixed',
                        default: 'absolute',
                    }),
                    opacity: value,
                },
            ], children: [!warning && (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: "white" }), warning && (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: require('expo-router/assets/error.png'), style: styles.icon }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { marginLeft: 8 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.text, children: children }), filenamePretty && (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.filename, children: filenamePretty })] })] }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        flex: 1,
    },
    icon: { width: 20, height: 20, resizeMode: 'contain' },
    toast: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        bottom: 8,
        left: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: 'black',
    },
    text: { color: 'white', fontSize: 16 },
    filename: {
        fontFamily: exports.CODE_FONT,
        opacity: 0.8,
        color: 'white',
        fontSize: 12,
    },
    code: { fontFamily: exports.CODE_FONT },
});
//# sourceMappingURL=Toast.js.map