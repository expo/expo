'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const Link_1 = require("../link/Link");
const errors_1 = require("../rsc/router/errors");
let useMetroSymbolication;
if (process.env.NODE_ENV === 'development') {
    const { LogBoxLog, parseErrorStack } = require('@expo/metro-runtime/symbolicate');
    useMetroSymbolication = function (error) {
        const [logBoxLog, setLogBoxLog] = (0, react_1.useState)(null);
        (0, react_1.useEffect)(() => {
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
            log.symbolicate('stack', () => {
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
    StackTrace = function () {
        return <react_native_1.View style={{ flex: 1 }}/>;
    };
}
function StandardErrorView({ error }) {
    return (<react_native_1.View style={{
            marginBottom: 12,
            gap: 4,
            flexWrap: process.env.EXPO_OS === 'web' ? 'wrap' : 'nowrap',
        }}>
      <react_native_1.Text role="heading" aria-level={1} style={styles.title}>
        Something went wrong
      </react_native_1.Text>
      <react_native_1.Text testID="router_error_message" role="heading" aria-level={2} style={styles.errorMessage}>
        Error: {error.message}
      </react_native_1.Text>
    </react_native_1.View>);
}
function ErrorBoundary({ error, retry }) {
    const logBoxLog = useMetroSymbolication(error);
    const inTabBar = (0, react_1.useContext)(bottom_tabs_1.BottomTabBarHeightContext);
    const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
    const isServerError = error instanceof errors_1.ReactServerError;
    return (<react_native_1.View style={styles.container}>
      <Wrapper style={{ flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }}>
        {isServerError ? (<>
            <ReactServerErrorView error={error}/>
            <react_native_1.View style={{ flex: 1 }}/>
          </>) : (<>
            <StandardErrorView error={error}/>
            <StackTrace logData={logBoxLog}/>
          </>)}

        {process.env.NODE_ENV === 'development' && (<Link_1.Link testID="router_error_sitemap" href="/_sitemap" style={styles.link}>
            Sitemap
          </Link_1.Link>)}
        <Pressable_1.Pressable testID="router_error_retry" onPress={retry}>
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
const COMMON_ERROR_STATUS = {
    404: 'NOT_FOUND',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
};
// TODO: This should probably be replaced by a DOM component that loads server errors in the future.
function ReactServerErrorView({ error }) {
    let title = String(error.statusCode);
    title += ': ' + (COMMON_ERROR_STATUS[error.statusCode] ?? 'Server Error');
    const errorId = error.headers.get('cf-ray');
    const date = error.headers.get('Date');
    return (<react_native_1.View style={{
            padding: 12,
            gap: 8,
        }}>
      <react_native_1.Text selectable allowFontScaling style={{
            fontSize: react_native_1.Platform.select({ web: 24, default: 16 }),
            fontWeight: 'bold',
            marginBottom: 4,
            color: 'white',
        }}>
        {title}
      </react_native_1.Text>

      {process.env.EXPO_OS === 'web' ? (<react_native_1.ScrollView style={{
                borderColor: 'rgba(255,255,255,0.5)',
                borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
                borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
                maxHeight: 150,
            }} contentContainerStyle={{ paddingVertical: 4 }}>
          <react_native_1.Text testID="router_error_message" selectable allowFontScaling style={{
                color: 'white',
            }}>
            {error.message}
          </react_native_1.Text>
        </react_native_1.ScrollView>) : (<react_native_1.TextInput testID="router_error_message" scrollEnabled multiline editable={false} allowFontScaling value={error.message} style={{
                borderColor: 'rgba(255,255,255,0.5)',
                borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
                borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
                paddingVertical: 4,
                maxHeight: 150,
                color: 'white',
            }}/>)}

      <InfoRow title="Code" right={error.statusCode}/>
      {errorId && <InfoRow title="ID" right={errorId}/>}
      {date && <InfoRow title="Date" right={date}/>}

      {error.url && (<react_native_1.Text selectable allowFontScaling style={{ fontSize: 14, opacity: 0.5, color: 'white' }}>
          {error.url}
        </react_native_1.Text>)}
    </react_native_1.View>);
}
function InfoRow({ title, right }) {
    const style = {
        fontSize: 16,
        color: 'white',
    };
    return (<react_native_1.View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <react_native_1.Text selectable allowFontScaling style={style}>
        {title}
      </react_native_1.Text>
      {right && (<react_native_1.Text selectable allowFontScaling style={[style, styles.code]}>
          {right}
        </react_native_1.Text>)}
    </react_native_1.View>);
}
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