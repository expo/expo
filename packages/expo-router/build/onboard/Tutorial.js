"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tutorial = Tutorial;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const getDevServer_1 = require("../getDevServer");
const link_1 = require("../link");
const Pressable_1 = require("../views/Pressable");
const canAutoTouchFile = process.env.EXPO_ROUTER_APP_ROOT != null;
function createEntryFileAsync() {
    if (process.env.NODE_ENV === 'production') {
        // No dev server
        console.warn('createEntryFile() cannot be used in production');
        return;
    }
    // Pings middleware in the Expo CLI dev server.
    return fetch((0, getDevServer_1.getDevServer)().url + '_expo/touch', {
        method: 'POST',
        body: JSON.stringify({ type: 'router_index' }),
    });
}
function Tutorial() {
    react_1.default.useEffect(() => {
        if (react_native_1.Platform.OS === 'web') {
            // Reset the route on web so the initial route isn't a 404 after
            // the user has created the entry file.
            // This is useful for cases where you are testing the tutorial.
            // To test: touch the new file, then navigate to a missing route `/foobar`, then delete the app folder.
            // you should see the tutorial again and be able to create the entry file once more.
            if (typeof location !== 'undefined' && location.pathname !== '/') {
                location.replace('/');
            }
            if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
                window.document.title = 'Welcome to Expo';
            }
        }
    }, []);
    return ((0, jsx_runtime_1.jsxs)(react_native_safe_area_context_1.SafeAreaView, { style: styles.background, children: [(0, jsx_runtime_1.jsx)(react_native_1.StatusBar, { barStyle: "light-content" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.logotypeWrapper, children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { style: styles.logotype, source: require('expo-router/assets/logotype.png') }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { role: "heading", "aria-level": 1, style: styles.title, children: "Welcome to Expo" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { role: "heading", "aria-level": 2, style: [styles.subtitle, styles.textSecondary], children: ["Start by creating a file", react_native_1.Platform.OS !== 'web' ? '\n' : ' ', "in the", ' ', (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontWeight: '600' }, children: getRootDir() }), " directory."] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: (0, jsx_runtime_1.jsx)(link_1.Link, { href: "https://docs.expo.dev/router/introduction/", ...react_native_1.Platform.select({ web: { target: '_blank' }, native: { asChild: true } }), children: (0, jsx_runtime_1.jsx)(Pressable_1.Pressable, { children: ({ hovered, pressed }) => ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                                        styles.link,
                                        react_native_1.Platform.select({
                                            web: {
                                                transitionDuration: '200ms',
                                                marginBottom: 12,
                                            },
                                        }),
                                        hovered && {
                                            opacity: 0.8,
                                            textDecorationLine: 'underline',
                                        },
                                        pressed && {
                                            opacity: 0.8,
                                        },
                                    ], children: "Learn more about Expo Router in the documentation." })) }) }) }), canAutoTouchFile && (0, jsx_runtime_1.jsx)(Button, {})] })] }));
}
function getRootDir() {
    const dir = process.env.EXPO_ROUTER_APP_ROOT ?? '';
    if (/[\\/]src[\\/]app$/.test(dir)) {
        return 'src/app';
    }
    else if (/[\\/]app$/.test(dir)) {
        return 'app';
    }
    return dir.split(/[\\/]/).pop() ?? '';
}
function Button() {
    return ((0, jsx_runtime_1.jsx)(Pressable_1.Pressable, { onPress: () => {
            createEntryFileAsync();
        }, style: styles.button, children: ({ pressed, hovered }) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                styles.buttonContainer,
                hovered && {
                    backgroundColor: '#fff',
                },
                pressed &&
                    react_native_1.Platform.select({
                        web: {
                            transform: 'scale(0.98)',
                            transitionDuration: '200ms',
                        },
                        default: {
                            backgroundColor: '#fff',
                        },
                    }),
            ], children: (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: [
                    styles.code,
                    hovered && { color: '#000' },
                    pressed &&
                        react_native_1.Platform.select({
                            native: { color: '#000' },
                        }),
                ], children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.textSecondary, children: "$" }), " touch ", `${getRootDir()}/index.tsx`] }) })) }));
}
const styles = react_native_1.StyleSheet.create({
    background: {
        backgroundColor: '#000',
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 24,
        paddingBottom: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 'auto',
        gap: 16,
        ...react_native_1.Platform.select({
            web: {
                maxWidth: 960,
            },
            native: {
                width: '100%',
            },
        }),
    },
    logotypeWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#151718',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#313538',
        width: 78,
        height: 78,
        marginBottom: 8,
    },
    logotype: {
        width: 48,
        height: 44,
    },
    title: {
        ...react_native_1.Platform.select({
            web: {
                fontSize: 64,
                lineHeight: 64,
            },
            default: {
                fontSize: 56,
                lineHeight: 56,
            },
        }),
        color: '#fff',
        fontWeight: '800',
        textAlign: 'center',
    },
    buttonContainer: {
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '200ms',
            },
        }),
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 2,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    button: {
        ...react_native_1.Platform.select({
            web: {
                marginTop: 12,
            },
            native: {
                position: 'absolute',
                bottom: 24,
                left: 32,
                right: 32,
                overflow: 'hidden',
            },
        }),
    },
    code: {
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '200ms',
                fontFamily: 'Courier, monospace',
            },
            default: {
                fontFamily: react_native_1.Platform.select({
                    ios: 'Courier New',
                    android: 'monospace',
                }),
            },
        }),
        color: '#fff',
        textAlign: 'center',
        userSelect: 'none',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 34,
        fontWeight: '200',
        textAlign: 'center',
    },
    link: {
        fontSize: 20,
        lineHeight: 26,
        textAlign: 'center',
        color: '#52a9ff',
        marginTop: 12,
        ...react_native_1.Platform.select({
            web: {
                marginBottom: 24,
            },
        }),
    },
    textSecondary: {
        color: '#9ba1a6',
    },
});
//# sourceMappingURL=Tutorial.js.map