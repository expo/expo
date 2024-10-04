import { LogContext } from '@expo/metro-runtime/build/error-overlay/Data/LogContext';
import { LogBoxInspectorStackFrames } from '@expo/metro-runtime/build/error-overlay/overlay/LogBoxInspectorStackFrames';
import { LogBoxLog, parseErrorStack } from '@expo/metro-runtime/symbolicate';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from './Pressable';
import { Link } from '../link/Link';
function useMetroSymbolication(error) {
    const [logBoxLog, setLogBoxLog] = React.useState(null);
    React.useEffect(() => {
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
}
export function ErrorBoundary({ error, retry }) {
    const logBoxLog = useMetroSymbolication(error);
    const inTabBar = React.useContext(BottomTabBarHeightContext);
    const Wrapper = inTabBar ? View : SafeAreaView;
    return (React.createElement(View, { style: styles.container },
        React.createElement(Wrapper, { style: { flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' } },
            React.createElement(View, { style: {
                    marginBottom: 12,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                } },
                React.createElement(Text, { role: "heading", "aria-level": 1, style: styles.title }, "Something went wrong")),
            React.createElement(StackTrace, { logData: logBoxLog }),
            process.env.NODE_ENV === 'development' && (React.createElement(Link, { href: "/_sitemap", style: styles.link }, "Sitemap")),
            React.createElement(Pressable, { onPress: retry }, ({ hovered, pressed }) => (React.createElement(View, { style: [styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }] },
                React.createElement(Text, { style: [
                        styles.buttonText,
                        {
                            color: hovered || pressed ? 'black' : 'white',
                        },
                    ] }, "Retry")))))));
}
function StackTrace({ logData }) {
    if (!logData?.symbolicated?.stack?.stack) {
        return null;
    }
    return (React.createElement(ScrollView, { style: { flex: 1 } },
        React.createElement(LogContext.Provider, { value: {
                isDisabled: false,
                logs: [logData],
                selectedLogIndex: 0,
            } },
            React.createElement(LogBoxInspectorStackFrames, { onRetry: function () { }, type: "stack" }))));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 24,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: Platform.select({ web: 32, default: 24 }),
        fontWeight: 'bold',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        ...Platform.select({
            web: {
                transitionDuration: '100ms',
            },
        }),
    },
    buttonInner: {
        transitionDuration: '100ms',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderColor: 'white',
        borderWidth: 2,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    code: {
        fontFamily: Platform.select({
            default: 'Courier',
            ios: 'Courier New',
            android: 'monospace',
        }),
        fontWeight: '500',
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