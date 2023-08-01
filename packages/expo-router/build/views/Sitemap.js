import { Image, Pressable, StyleSheet, Text, View } from '@bacons/react-views';
import React from 'react';
import { ScrollView, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpoRouter } from '../global-state/router-store';
import { router } from '../imperative-api';
import { Link } from '../link/Link';
import { matchDeepDynamicRouteName } from '../matchers';
const INDENT = 24;
export function getNavOptions() {
    return {
        title: 'sitemap',
        headerShown: false,
        presentation: 'modal',
        animation: 'default',
        headerLargeTitle: false,
        headerTitleStyle: {
            color: 'white',
        },
        headerTintColor: 'white',
        headerLargeTitleStyle: {
            color: 'white',
        },
        headerStyle: {
            backgroundColor: 'black',
            // @ts-expect-error: mistyped
            borderBottomColor: '#323232',
        },
    };
}
export function Sitemap() {
    const { top, bottom } = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    return (React.createElement(View, { style: styles.container },
        React.createElement(StatusBar, { barStyle: "light-content" }),
        React.createElement(View, { style: [
                styles.main,
                {
                    minWidth: Math.min(960, width * 0.9),
                },
            ] },
            React.createElement(ScrollView, { contentContainerStyle: [
                    styles.scroll,
                    {
                        paddingTop: top + 12,
                        paddingBottom: bottom + 12,
                    },
                ], style: { flex: 1 } },
                React.createElement(FileSystemView, null)))));
}
function FileSystemView() {
    const routes = useExpoRouter().getSortedRoutes();
    return (React.createElement(React.Fragment, null, routes.map((child) => (React.createElement(View, { key: child.contextKey, style: styles.itemContainer },
        React.createElement(FileItem, { route: child }))))));
}
function FileItem({ route, level = 0, parents = [], isInitial = false, }) {
    const disabled = route.children.length > 0;
    const segments = React.useMemo(() => [...parents, ...route.route.split('/')], [parents, route.route]);
    const href = React.useMemo(() => {
        return ('/' +
            segments
                .map((v) => {
                // add an extra layer of entropy to the url for deep dynamic routes
                if (matchDeepDynamicRouteName(v)) {
                    return v + '/' + Date.now();
                }
                // index must be erased but groups can be preserved.
                return v === 'index' ? '' : v;
            })
                .filter(Boolean)
                .join('/'));
    }, [segments, route.route]);
    const filename = React.useMemo(() => {
        const segments = route.contextKey.split('/');
        // join last two segments for layout routes
        if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
            return segments[segments.length - 2] + '/' + segments[segments.length - 1];
        }
        const segmentCount = route.route.split('/').length;
        // Join the segment count in reverse order
        // This presents files without layout routes as children with all relevant segments.
        return segments.slice(-segmentCount).join('/');
    }, [route]);
    const info = isInitial ? 'Initial' : route.generated ? 'Virtual' : '';
    return (React.createElement(React.Fragment, null,
        !route.internal && (React.createElement(Link, { accessibilityLabel: route.contextKey, href: href, onPress: () => {
                if (Platform.OS !== 'web' && router.canGoBack()) {
                    // Ensure the modal pops
                    router.back();
                }
            }, style: { flex: 1, display: 'flex' }, disabled: disabled, asChild: true, 
            // Ensure we replace the history so you can't go back to this page.
            replace: true },
            React.createElement(Pressable, { style: { flex: 1 } }, ({ pressed, hovered }) => (React.createElement(View, { style: [
                    styles.itemPressable,
                    {
                        paddingLeft: INDENT + level * INDENT,
                        backgroundColor: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                    },
                    pressed && { backgroundColor: '#323232' },
                    disabled && { opacity: 0.4 },
                ] },
                React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                    route.children.length ? React.createElement(PkgIcon, null) : React.createElement(FileIcon, null),
                    React.createElement(Text, { style: styles.filename }, filename)),
                React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                    !!info && (React.createElement(Text, { style: [styles.virtual, !disabled && { marginRight: 8 }] }, info)),
                    !disabled && React.createElement(ForwardIcon, null))))))),
        route.children.map((child) => (React.createElement(FileItem, { key: child.contextKey, route: child, isInitial: route.initialRouteName === child.route, parents: segments, level: level + (route.generated ? 0 : 1) })))));
}
function FileIcon() {
    return React.createElement(Image, { style: styles.image, source: require('expo-router/assets/file.png') });
}
function PkgIcon() {
    return React.createElement(Image, { style: styles.image, source: require('expo-router/assets/pkg.png') });
}
function ForwardIcon() {
    return React.createElement(Image, { style: styles.image, source: require('expo-router/assets/forward.png') });
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
        alignItems: 'stretch',
    },
    main: {
        marginHorizontal: 'auto',
        flex: 1,
        alignItems: 'stretch',
    },
    scroll: {
        paddingHorizontal: 12,
        // flex: 1,
        // paddingTop: top + 12,
        alignItems: 'stretch',
    },
    itemContainer: {
        borderWidth: 1,
        borderColor: '#323232',
        borderRadius: 19,
        marginBottom: 12,
        overflow: 'hidden',
    },
    itemPressable: {
        paddingHorizontal: INDENT,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        transitionDuration: '100ms',
    },
    filename: { color: 'white', fontSize: 20, marginLeft: 12 },
    virtual: { textAlign: 'right', color: 'white' },
    image: { width: 24, height: 24, resizeMode: 'contain' },
});
//# sourceMappingURL=Sitemap.js.map