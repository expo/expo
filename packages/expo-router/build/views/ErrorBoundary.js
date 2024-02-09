"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const Link_1 = require("../link/Link");
let useMetroSymbolication;
if (process.env.NODE_ENV === 'development') {
    const { LogBoxLog, parseErrorStack } = require('@expo/metro-runtime/symbolicate');
    useMetroSymbolication = function (error) {
        const [logBoxLog, setLogBoxLog] = react_1.default.useState(null);
        react_1.default.useEffect(() => {
            let isMounted = true;
            const stack = parseErrorStack(error.stack);
            const log = new LogBoxLog({
                level: 'error',
                message: {
                    content: error.message,
                    substitutions: [],
                },
                isComponentError: false,
                stack,
                category: error.message,
                componentStack: [],
            });
            log.symbolicate('stack', (symbolicatedLog) => {
                if (isMounted) {
                    setLogBoxLog(log);
                }
            });
            return () => {
                isMounted = false;
            };
        }, [error]);
        return logBoxLog;
    };
}
else {
    useMetroSymbolication = function () {
        return null;
    };
}
let StackTrace;
if (process.env.NODE_ENV === 'development') {
    const { LogContext } = require('@expo/metro-runtime/build/error-overlay/Data/LogContext');
    const { LogBoxInspectorStackFrames, } = require('@expo/metro-runtime/build/error-overlay/overlay/LogBoxInspectorStackFrames');
    StackTrace = function ({ logData }) {
        if (!logData?.symbolicated?.stack?.stack) {
            return null;
        }
        return (<react_native_1.ScrollView style={{ flex: 1 }}>
        <LogContext.Provider value={{
                isDisabled: false,
                logs: [logData],
                selectedLogIndex: 0,
            }}>
          <LogBoxInspectorStackFrames onRetry={function () { }} type="stack"/>
        </LogContext.Provider>
      </react_native_1.ScrollView>);
    };
}
else {
    StackTrace = function () {
        return <react_native_1.View style={{ flex: 1 }}/>;
    };
}
function ErrorBoundary({ error, retry }) {
    const logBoxLog = useMetroSymbolication(error);
    const inTabBar = react_1.default.useContext(bottom_tabs_1.BottomTabBarHeightContext);
    const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
    return (<react_native_1.View style={styles.container}>
      <Wrapper style={{ flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }}>
        <react_native_1.View style={{
            marginBottom: 12,
            gap: 4,
            flexWrap: 'wrap',
        }}>
          <react_native_1.Text role="heading" aria-level={1} style={styles.title}>
            Something went wrong
          </react_native_1.Text>
          <react_native_1.Text role="heading" aria-level={2} style={styles.errorMessage}>
            Error: {error.message}
          </react_native_1.Text>
        </react_native_1.View>

        <StackTrace logData={logBoxLog}/>
        {process.env.NODE_ENV === 'development' && (<Link_1.Link href="/_sitemap" style={styles.link}>
            Sitemap
          </Link_1.Link>)}
        <Pressable_1.Pressable onPress={retry}>
          {({ hovered, pressed }) => (<react_native_1.View style={[styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }]}>
              <react_native_1.Text style={[
                styles.buttonText,
                {
                    color: hovered || pressed ? 'black' : 'white',
                },
            ]}>
                Retry
              </react_native_1.Text>
            </react_native_1.View>)}
        </Pressable_1.Pressable>
      </Wrapper>
    </react_native_1.View>);
}
exports.ErrorBoundary = ErrorBoundary;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 24,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: react_native_1.Platform.select({ web: 32, default: 24 }),
        fontWeight: 'bold',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '100ms',
            },
        }),
    },
    buttonInner: {
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '100ms',
            },
        }),
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderColor: 'white',
        borderWidth: 2,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    code: {
        fontFamily: react_native_1.Platform.select({
            default: 'Courier',
            ios: 'Courier New',
            android: 'monospace',
        }),
        fontWeight: '500',
    },
    errorMessage: {
        color: 'white',
        fontSize: 16,
    },
    subtitle: {
        color: 'white',
        fontSize: 14,
        marginBottom: 12,
        // textAlign: "center",
    },
    link: {
        color: 'rgba(255,255,255,0.4)',
        textDecorationStyle: 'solid',
        textDecorationLine: 'underline',
        fontSize: 14,
        textAlign: 'center',
    },
});
//# sourceMappingURL=ErrorBoundary.js.map