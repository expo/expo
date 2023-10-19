"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sitemap = exports.getNavOptions = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Pressable_1 = require("./Pressable");
const router_store_1 = require("../global-state/router-store");
const imperative_api_1 = require("../imperative-api");
const Link_1 = require("../link/Link");
const matchers_1 = require("../matchers");
const INDENT = 24;
function getNavOptions() {
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
exports.getNavOptions = getNavOptions;
function Sitemap() {
    const { top, bottom } = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { width } = (0, react_native_1.useWindowDimensions)();
    return (<react_native_1.View style={styles.container}>
      <react_native_1.StatusBar barStyle="light-content"/>
      <react_native_1.View style={[
            styles.main,
            {
                minWidth: Math.min(960, width * 0.9),
            },
        ]}>
        <react_native_1.ScrollView contentContainerStyle={[
            styles.scroll,
            {
                paddingTop: top + 12,
                paddingBottom: bottom + 12,
            },
        ]} style={{ flex: 1 }}>
          <FileSystemView />
        </react_native_1.ScrollView>
      </react_native_1.View>
    </react_native_1.View>);
}
exports.Sitemap = Sitemap;
function FileSystemView() {
    const routes = (0, router_store_1.useExpoRouter)().getSortedRoutes();
    return (<>
      {routes.map((child) => (<react_native_1.View key={child.contextKey} style={styles.itemContainer}>
          <FileItem route={child}/>
        </react_native_1.View>))}
    </>);
}
function FileItem({ route, level = 0, parents = [], isInitial = false, }) {
    const disabled = route.children.length > 0;
    const segments = react_1.default.useMemo(() => [...parents, ...route.route.split('/')], [parents, route.route]);
    const href = react_1.default.useMemo(() => {
        return ('/' +
            segments
                .map((v) => {
                // add an extra layer of entropy to the url for deep dynamic routes
                if ((0, matchers_1.matchDeepDynamicRouteName)(v)) {
                    return v + '/' + Date.now();
                }
                // index must be erased but groups can be preserved.
                return v === 'index' ? '' : v;
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
        const segmentCount = route.route.split('/').length;
        // Join the segment count in reverse order
        // This presents files without layout routes as children with all relevant segments.
        return segments.slice(-segmentCount).join('/');
    }, [route]);
    const info = isInitial ? 'Initial' : route.generated ? 'Virtual' : '';
    return (<>
      {!route.internal && (<Link_1.Link accessibilityLabel={route.contextKey} href={href} onPress={() => {
                if (react_native_1.Platform.OS !== 'web' && imperative_api_1.router.canGoBack()) {
                    // Ensure the modal pops
                    imperative_api_1.router.back();
                }
            }} style={{ flex: 1, display: 'flex' }} disabled={disabled} asChild 
        // Ensure we replace the history so you can't go back to this page.
        replace>
          <Pressable_1.Pressable style={{ flex: 1 }}>
            {({ pressed, hovered }) => (<react_native_1.View style={[
                    styles.itemPressable,
                    {
                        paddingLeft: INDENT + level * INDENT,
                        backgroundColor: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                    },
                    pressed && { backgroundColor: '#323232' },
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
const styles = react_native_1.StyleSheet.create({
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