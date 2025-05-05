"use strict";
// Copyright © 2024 650 Industries.
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavOptions = getNavOptions;
exports.Sitemap = Sitemap;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const Route_1 = require("../Route");
const router_store_1 = require("../global-state/router-store");
const imperative_api_1 = require("../imperative-api");
const Link_1 = require("../link/Link");
const matchers_1 = require("../matchers");
const statusbar_1 = require("../utils/statusbar");
const INDENT = 20;
function getNavOptions() {
    return {
        title: 'sitemap',
        presentation: 'modal',
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
        header: () => {
            const WrapperElement = react_native_1.Platform.OS === 'android' ? react_native_safe_area_context_1.SafeAreaView : react_native_1.View;
            return (<WrapperElement style={styles.header}>
          <react_native_1.View style={styles.headerContent}>
            <react_native_1.View style={styles.headerIcon}>
              <SitemapIcon />
            </react_native_1.View>
            <react_native_1.Text role="heading" aria-level={1} style={styles.title}>
              Sitemap
            </react_native_1.Text>
          </react_native_1.View>
        </WrapperElement>);
        },
    };
}
function Sitemap() {
    return (<react_native_1.View style={styles.container}>
      {statusbar_1.canOverrideStatusBarBehavior && <react_native_1.StatusBar barStyle="light-content"/>}
      <react_native_1.ScrollView contentContainerStyle={styles.scroll}>
        <FileSystemView />
      </react_native_1.ScrollView>
    </react_native_1.View>);
}
function FileSystemView() {
    // This shouldn't occur, as the user should be on the tutorial screen
    if (!router_store_1.store.routeNode)
        return null;
    return router_store_1.store.routeNode.children.sort(Route_1.sortRoutes).map((route) => (<react_native_1.View key={route.contextKey} style={styles.itemContainer}>
      <FileItem route={route}/>
    </react_native_1.View>));
}
function FileItem({ route, level = 0, parents = [], isInitial = false, }) {
    const disabled = route.children.length > 0;
    const segments = react_1.default.useMemo(() => [...parents, ...route.route.split('/')], [parents, route.route]);
    const href = react_1.default.useMemo(() => {
        return ('/' +
            segments
                .map((segment) => {
                // add an extra layer of entropy to the url for deep dynamic routes
                if ((0, matchers_1.matchDeepDynamicRouteName)(segment)) {
                    return segment + '/' + Date.now();
                }
                // index must be erased but groups can be preserved.
                return segment === 'index' ? '' : segment;
            })
                .filter(Boolean)
                .join('/'));
    }, [segments, route.route]);
    const filename = react_1.default.useMemo(() => {
        const segments = route.contextKey.split('/');
        // join last two segments for layout routes
        if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
            return segments[segments.length - 2] + '/' + segments[segments.length - 1];
        }
        const routeSegmentsCount = route.route.split('/').length;
        // Join the segment count in reverse order
        // This presents files without layout routes as children with all relevant segments.
        return segments.slice(-routeSegmentsCount).join('/');
    }, [route]);
    const info = isInitial ? 'Initial' : route.generated ? 'Virtual' : '';
    return (<>
      {!route.internal && (<Link_1.Link accessibilityLabel={route.contextKey} href={href} onPress={() => {
                if (react_native_1.Platform.OS !== 'web' && imperative_api_1.router.canGoBack()) {
                    // Ensure the modal pops
                    imperative_api_1.router.back();
                }
            }} disabled={disabled} asChild 
        // Ensure we replace the history so you can't go back to this page.
        replace>
          <Pressable_1.Pressable>
            {({ pressed, hovered }) => (<react_native_1.View style={[
                    styles.itemPressable,
                    {
                        paddingLeft: INDENT + level * INDENT,
                        backgroundColor: hovered ? '#202425' : 'transparent',
                    },
                    pressed && { backgroundColor: '#26292b' },
                    disabled && { opacity: 0.4 },
                ]}>
                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {route.children.length ? <PkgIcon /> : <FileIcon />}
                  <react_native_1.Text style={styles.filename}>{filename}</react_native_1.Text>
                </react_native_1.View>

                <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!!info && (<react_native_1.Text style={[styles.virtual, !disabled && { marginRight: 8 }]}>{info}</react_native_1.Text>)}
                  {!disabled && <ForwardIcon />}
                </react_native_1.View>
              </react_native_1.View>)}
          </Pressable_1.Pressable>
        </Link_1.Link>)}
      {route.children.map((child) => (<FileItem key={child.contextKey} route={child} isInitial={route.initialRouteName === child.route} parents={segments} level={level + (route.generated ? 0 : 1)}/>))}
    </>);
}
function FileIcon() {
    return <react_native_1.Image style={styles.image} source={require('expo-router/assets/file.png')}/>;
}
function PkgIcon() {
    return <react_native_1.Image style={styles.image} source={require('expo-router/assets/pkg.png')}/>;
}
function ForwardIcon() {
    return <react_native_1.Image style={styles.image} source={require('expo-router/assets/forward.png')}/>;
}
function SitemapIcon() {
    return <react_native_1.Image style={styles.image} source={require('expo-router/assets/sitemap.png')}/>;
}
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
        alignItems: 'stretch',
    },
    header: {
        backgroundColor: '#151718',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#313538',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.33,
        shadowRadius: 3,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: '5%',
        ...react_native_1.Platform.select({
            web: {
                width: '100%',
                maxWidth: 960,
                marginHorizontal: 'auto',
            },
        }),
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    scroll: {
        paddingHorizontal: '5%',
        paddingVertical: 16,
        ...react_native_1.Platform.select({
            ios: {
                paddingBottom: 24,
            },
            web: {
                width: '100%',
                maxWidth: 960,
                marginHorizontal: 'auto',
                paddingBottom: 24,
            },
            default: {
                paddingBottom: 12,
            },
        }),
    },
    itemContainer: {
        borderWidth: 1,
        borderColor: '#313538',
        backgroundColor: '#151718',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    itemPressable: {
        paddingHorizontal: INDENT,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...react_native_1.Platform.select({
            web: {
                transitionDuration: '100ms',
            },
        }),
    },
    filename: { color: 'white', fontSize: 20, marginLeft: 12 },
    virtual: { textAlign: 'right', color: 'white' },
    image: { width: 24, height: 24, resizeMode: 'contain', opacity: 0.6 },
    headerIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#202425',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
//# sourceMappingURL=Sitemap.js.map