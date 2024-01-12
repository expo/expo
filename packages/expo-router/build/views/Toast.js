"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toast = exports.ToastWrapper = exports.CODE_FONT = void 0;
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
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
    const inTabBar = react_1.default.useContext(bottom_tabs_1.BottomTabBarHeightContext);
    const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
    return (<Wrapper collapsable={false} style={{ flex: 1 }}>
      {children}
    </Wrapper>);
}
exports.ToastWrapper = ToastWrapper;
function Toast({ children, filename, warning, }) {
    const filenamePretty = react_1.default.useMemo(() => {
        if (!filename)
            return undefined;
        return 'app' + filename.replace(/^\./, '');
    }, [filename]);
    const value = useFadeIn();
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Animated.View style={[
            styles.toast,
            // @ts-expect-error: fixed is supported on web.
            {
                position: react_native_1.Platform.select({
                    web: 'fixed',
                    default: 'absolute',
                }),
                opacity: value,
            },
        ]}>
        {!warning && <react_native_1.ActivityIndicator color="white"/>}
        {warning && <react_native_1.Image source={require('expo-router/assets/error.png')} style={styles.icon}/>}
        <react_native_1.View style={{ marginLeft: 8 }}>
          <react_native_1.Text style={styles.text}>{children}</react_native_1.Text>
          {filenamePretty && <react_native_1.Text style={styles.filename}>{filenamePretty}</react_native_1.Text>}
        </react_native_1.View>
      </react_native_1.Animated.View>
    </react_native_1.View>);
}
exports.Toast = Toast;
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