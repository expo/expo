"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = ErrorBoundary;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const Link_1 = require("../link/Link");
const bottom_tabs_1 = require("../react-navigation/bottom-tabs");
const errors_1 = require("../rsc/router/errors");
function StandardErrorView({ error }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: {
            marginBottom: 12,
            gap: 4,
            flexWrap: process.env.EXPO_OS === 'web' ? 'wrap' : 'nowrap',
        }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { role: "heading", "aria-level": 1, style: styles.title, children: "Something went wrong" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { testID: "router_error_message", role: "heading", "aria-level": 2, style: styles.errorMessage, children: ["Error: ", error.message] })] }));
}
function ErrorBoundary({ error, retry }) {
    const inTabBar = (0, react_1.use)(bottom_tabs_1.BottomTabBarHeightContext);
    const Wrapper = inTabBar ? react_native_1.View : react_native_safe_area_context_1.SafeAreaView;
    const isServerError = error instanceof errors_1.ReactServerError;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, children: (0, jsx_runtime_1.jsxs)(Wrapper, { style: { flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }, children: [isServerError ? ((0, jsx_runtime_1.jsx)(ReactServerErrorView, { error: error })) : ((0, jsx_runtime_1.jsx)(StandardErrorView, { error: error })), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1 } }), process.env.NODE_ENV === 'development' && ((0, jsx_runtime_1.jsx)(Link_1.Link, { testID: "router_error_sitemap", href: "/_sitemap", style: styles.link, children: "Sitemap" })), (0, jsx_runtime_1.jsx)(Pressable_1.Pressable, { testID: "router_error_retry", onPress: retry, children: ({ hovered, pressed }) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                                styles.buttonText,
                                {
                                    color: hovered || pressed ? 'black' : 'white',
                                },
                            ], children: "Retry" }) })) })] }) }));
}
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
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: {
            padding: 12,
            gap: 8,
        }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { selectable: true, allowFontScaling: true, style: {
                    fontSize: react_native_1.Platform.select({ web: 24, default: 16 }),
                    fontWeight: 'bold',
                    marginBottom: 4,
                    color: 'white',
                }, children: title }), process.env.EXPO_OS === 'web' ? ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: {
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
                    borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
                    maxHeight: 150,
                }, contentContainerStyle: { paddingVertical: 4 }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { testID: "router_error_message", selectable: true, allowFontScaling: true, style: {
                        color: 'white',
                    }, children: error.message }) })) : ((0, jsx_runtime_1.jsx)(react_native_1.TextInput, { testID: "router_error_message", scrollEnabled: true, multiline: true, editable: false, allowFontScaling: true, value: error.message, style: {
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
                    borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
                    paddingVertical: 4,
                    maxHeight: 150,
                    color: 'white',
                } })), (0, jsx_runtime_1.jsx)(InfoRow, { title: "Code", right: error.statusCode }), errorId && (0, jsx_runtime_1.jsx)(InfoRow, { title: "ID", right: errorId }), date && (0, jsx_runtime_1.jsx)(InfoRow, { title: "Date", right: date }), error.url && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { selectable: true, allowFontScaling: true, style: { fontSize: 14, opacity: 0.5, color: 'white' }, children: error.url }))] }));
}
function InfoRow({ title, right }) {
    const style = {
        fontSize: 16,
        color: 'white',
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { selectable: true, allowFontScaling: true, style: style, children: title }), right && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { selectable: true, allowFontScaling: true, style: [style, styles.code], children: right }))] }));
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