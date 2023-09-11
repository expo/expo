"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tutorial = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const createEntryFile_1 = require("./createEntryFile");
const exports_1 = require("../exports");
const Pressable_1 = require("../views/Pressable");
// TODO: Use openLinkFromBrowser thing
function Header() {
    return (react_1.default.createElement(Pressable_1.Pressable, null, ({ hovered }) => (react_1.default.createElement(react_native_1.Text, { role: "heading", "aria-level": 1, style: [styles.title, react_native_1.Platform.OS !== 'web' && { textAlign: 'left' }] },
        "Welcome to",
        ' ',
        react_1.default.createElement(exports_1.Link, { href: "https://github.com/expo/expo-router/", style: [
                hovered && {
                    textDecorationColor: 'white',
                    textDecorationLine: 'underline',
                },
            ] }, "Expo")))));
}
const canAutoTouchFile = process.env.EXPO_ROUTER_APP_ROOT != null;
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
                window.document.title = 'npx expo start';
            }
        }
    }, []);
    return (react_1.default.createElement(react_native_1.View, { style: styles.background },
        react_1.default.createElement(react_native_1.StatusBar, { barStyle: "light-content" }),
        react_1.default.createElement(react_native_safe_area_context_1.SafeAreaView, { style: styles.safeArea },
            react_1.default.createElement(react_native_1.View, { style: styles.container },
                react_1.default.createElement(Header, null),
                react_1.default.createElement(react_native_1.Text, { role: "heading", "aria-level": 2, style: styles.subtitle },
                    "Start by creating a file",
                    '\n',
                    "in the",
                    ' ',
                    react_1.default.createElement(react_native_1.Text, { style: { fontWeight: 'bold' } }, getRootDir()),
                    " directory."),
                canAutoTouchFile && react_1.default.createElement(Button, null)))));
}
exports.Tutorial = Tutorial;
function getRootDir() {
    const dir = process.env.EXPO_ROUTER_ABS_APP_ROOT;
    if (dir.match(/\/src\/app$/)) {
        return 'src/app';
    }
    else if (dir.match(/\/app$/)) {
        return 'app';
    }
    return dir.split('/').pop() ?? dir;
}
function Button() {
    return (react_1.default.createElement(Pressable_1.Pressable, { onPress: () => {
            (0, createEntryFile_1.createEntryFileAsync)();
        }, style: {
            ...react_native_1.Platform.select({
                web: {
                    // subtle white shadow
                    boxShadow: 'rgba(255, 255, 255, 0.15) 0px 0px 20px 5px',
                },
                native: {
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    right: 24,
                    overflow: 'hidden',
                },
            }),
        } }, ({ pressed, hovered }) => (react_1.default.createElement(react_native_1.View, { style: [
            styles.buttonContainer,
            hovered && {
                backgroundColor: 'white',
            },
            pressed && {
                backgroundColor: 'rgba(255,255,255,0.7)',
            },
        ] },
        react_1.default.createElement(react_native_1.Text, { style: [styles.code, hovered && { color: 'black' }] },
            react_1.default.createElement(react_native_1.Text, { style: { color: '#BCC3CD' } }, "$"),
            " touch ",
            getRootDir(),
            "/index.js")))));
}
const styles = react_native_1.StyleSheet.create({
    background: {
        ...react_native_1.Platform.select({
            web: {
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundPositionX: -3,
                backgroundPositionY: -3,
                backgroundSize: '40px 40px',
            },
        }),
        backgroundColor: 'black',
        flex: 1,
    },
    safeArea: {
        flex: 1,
        maxWidth: 960,
        marginHorizontal: 'auto',
        alignItems: 'stretch',
    },
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: 64,
        paddingBottom: 24,
        fontWeight: 'bold',
    },
    buttonContainer: {
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '200ms',
                backgroundColor: 'transparent',
            },
            default: {
                backgroundColor: 'white',
            },
        }),
        borderColor: 'white',
        borderWidth: 2,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    buttonText: {
        color: 'black',
    },
    code: {
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '200ms',
                color: 'white',
                fontFamily: 'Courier',
            },
            default: {
                color: 'black',
                fontFamily: react_native_1.Platform.select({
                    ios: 'Courier New',
                    android: 'monospace',
                }),
            },
        }),
        userSelect: 'none',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#BCC3CD',
        fontSize: 36,
        fontWeight: '100',
        paddingBottom: 36,
        maxWidth: 960,
    },
});
//# sourceMappingURL=Tutorial.js.map