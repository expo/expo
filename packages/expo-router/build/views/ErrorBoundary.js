'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const react_native_1 = require("react-native");
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const errors_1 = require("../rsc/router/errors");
const remote_origin_1 = require("../remote-origin");
// import { Link } from '../link/Link';
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
let ErrorMessageText;
if (process.env.NODE_ENV === 'development') {
    const { Ansi } = require('@expo/metro-runtime/src/error-overlay/UI/AnsiHighlight');
    ErrorMessageText = function ({ text, style }) {
        return (<Ansi style={[
                {
                    fontSize: 12,
                    includeFontPadding: false,
                    lineHeight: 20,
                    fontFamily: react_native_1.Platform.select({
                        default: 'Courier',
                        ios: 'Courier New',
                        android: 'monospace',
                    }),
                },
                style,
            ]} text={text}/>);
    };
    const { LogContext } = require('@expo/metro-runtime/src/error-overlay/Data/LogContext');
    const { LogBoxInspectorStackFrames, } = require('@expo/metro-runtime/src/error-overlay/overlay/LogBoxInspectorStackFrames');
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
    ErrorMessageText = function ({ text, style }) {
        return (<react_native_1.Text role="heading" aria-level={2} children={text} style={[{ flexWrap: 'wrap', maxWidth: '100%' }, style]}/>);
    };
    StackTrace = function () {
        return <react_native_1.View style={{ flex: 1 }}/>;
    };
}
const useWrapper = react_native_1.Platform.OS === 'web'
    ? () => react_native_1.View
    : function useWrapper() {
        const inTabBar = react_1.default.useContext(bottom_tabs_1.BottomTabBarHeightContext);
        const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
        return Wrapper;
    };
function isNetworkError(error) {
    return !!error.message.match(/Network request failed: (The network connection was lost|Could not connect to the server)/);
}
function ErrorBoundary({ error, retry }) {
    // TODO: Add digest support for RSC errors
    // https://github.com/vercel/next.js/blob/f82445b01c885c2dce65c99043666f4a3efdbd9d/packages/next/src/client/components/error-boundary.tsx#L132-L151
    // console.log('E>', error, { digest: error?.digest });
    const logBoxLog = useMetroSymbolication(error);
    console.log('INSPECT>ERR:', error);
    console.log('-- Keys: ', Object.keys(error));
    console.log('-- Entries: ', Object.entries(error));
    if (error instanceof errors_1.NetworkError) {
        return (<Container>
        <react_native_1.View style={{
                marginBottom: 12,
                gap: 4,
                flexWrap: 'wrap',
            }}>
          <react_native_1.Text selectable role="heading" aria-level={1} style={styles.title} numberOfLines={4}>
            Failed to connect to server
          </react_native_1.Text>
          <react_native_1.Text selectable role="heading" aria-level={3} style={[
                styles.title,
                {
                    padding: 8,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 'normal',
                },
            ]} numberOfLines={4}>
            {error.url}
          </react_native_1.Text>
          <ErrorMessageText style={styles.errorMessage} text={`Error: ${error.message}`}/>
        </react_native_1.View>

        <StackTrace logData={logBoxLog}/>

        <CustomButton onPress={() => {
                (0, remote_origin_1.promptChangeServer)();
            }}>
          Change server origin
        </CustomButton>
        <RetryButton onPress={retry}/>
      </Container>);
    }
    return (<Container>
      <react_native_1.View style={{
            marginBottom: 12,
            gap: 4,
            flexDirection: 'column',
        }}>
        <react_native_1.Text selectable role="heading" aria-level={1} style={styles.title} numberOfLines={4}>
          Something went wrong
        </react_native_1.Text>
        <ErrorMessageText style={styles.errorMessage} text={`Error: ${error.message}`}/>
      </react_native_1.View>

      <StackTrace logData={logBoxLog}/>

      <RetryButton onPress={retry}/>
    </Container>);
}
exports.ErrorBoundary = ErrorBoundary;
function Container({ children }) {
    const Wrapper = useWrapper();
    return (<Wrapper style={{ flex: 1 }}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View style={{
            flex: 1,
            gap: 8,
            maxWidth: 720,
            marginHorizontal: process.env.EXPO_OS === 'web' ? 'auto' : undefined,
        }}>
          {children}
        </react_native_1.View>
      </react_native_1.View>
    </Wrapper>);
}
function RetryButton({ onPress }) {
    return <CustomButton onPress={onPress}>Retry</CustomButton>;
}
function CustomButton({ onPress, children }) {
    return (<Pressable_1.Pressable onPress={onPress}>
      {({ hovered, pressed }) => (<react_native_1.View style={[styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }]}>
          <react_native_1.Text style={[
                styles.buttonText,
                {
                    color: hovered || pressed ? 'black' : 'white',
                },
            ]}>
            {children}
          </react_native_1.Text>
        </react_native_1.View>)}
    </Pressable_1.Pressable>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        maxWidth: '100%',
        maxHeight: '100%',
        backgroundColor: 'black',
        padding: 24,
        alignItems: 'stretch',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    title: {
        color: 'white',
        textAlign: 'left',
        maxWidth: '100%',
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
        maxWidth: '100%',
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