"use strict";
// Copyright © 2024 650 Industries.
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavOptions = getNavOptions;
exports.Sitemap = Sitemap;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const NoSSR_1 = require("./NoSSR");
const Pressable_1 = require("./Pressable");
const useSitemap_1 = require("./useSitemap");
const Link_1 = require("../link/Link");
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
        headerShown: true,
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
    // Following the https://github.com/expo/expo/blob/ubax/router/move-404-and-sitemap-to-root/packages/expo-router/src/getRoutesSSR.ts#L38
    // we need to ensure that the Sitemap component is not rendered on the server.
    return (<NoSSR_1.NoSSR>
      <SitemapInner />
    </NoSSR_1.NoSSR>);
}
function SitemapInner() {
    const sitemap = (0, useSitemap_1.useSitemap)();
    const children = react_1.default.useMemo(() => sitemap?.children.filter(({ isInternal }) => !isInternal) ?? [], [sitemap]);
    return (<react_native_1.View style={styles.container} testID="expo-router-sitemap">
      {statusbar_1.canOverrideStatusBarBehavior && <react_native_1.StatusBar barStyle="light-content"/>}
      <react_native_1.ScrollView contentContainerStyle={styles.scroll} automaticallyAdjustContentInsets contentInsetAdjustmentBehavior="automatic">
        {children.map((child) => (<react_native_1.View testID="sitemap-item-container" key={child.contextKey} style={styles.itemContainer}>
            <SitemapItem node={child}/>
          </react_native_1.View>))}
        <SystemInfo />
      </react_native_1.ScrollView>
    </react_native_1.View>);
}
function SitemapItem({ node, level = 0 }) {
    const isLayout = react_1.default.useMemo(() => node.children.length > 0 || node.contextKey.match(/_layout\.[jt]sx?$/), [node]);
    const info = node.isInitial ? 'Initial' : node.isGenerated ? 'Generated' : '';
    if (isLayout) {
        return <LayoutSitemapItem node={node} level={level} info={info}/>;
    }
    return <StandardSitemapItem node={node} level={level} info={info}/>;
}
function LayoutSitemapItem({ node, level, info }) {
    const [isCollapsed, setIsCollapsed] = react_1.default.useState(true);
    return (<react_native_1.View style={styles.itemInnerContainer}>
      <SitemapItemPressable style={{ opacity: 0.4 }} leftIcon={<PkgIcon />} rightIcon={<ArrowIcon rotation={isCollapsed ? 0 : 180}/>} filename={node.filename} level={level} info={info} onPress={() => setIsCollapsed((prev) => !prev)}/>
      {!isCollapsed &&
            node.children.map((child) => (<SitemapItem key={child.contextKey} node={child} level={level + (node.isGenerated ? 0 : 1)}/>))}
    </react_native_1.View>);
}
function StandardSitemapItem({ node, info, level }) {
    return (<Link_1.Link accessibilityLabel={node.contextKey} href={node.href} asChild replace>
      <SitemapItemPressable leftIcon={<FileIcon />} rightIcon={<ForwardIcon />} filename={node.filename} level={level} info={info}/>
    </Link_1.Link>);
}
function SitemapItemPressable({ style, leftIcon, rightIcon, filename, level, info, ...pressableProps }) {
    return (<Pressable_1.Pressable {...pressableProps}>
      {({ pressed, hovered }) => (<react_native_1.View testID="sitemap-item" style={[
                styles.itemInnerContainer,
                styles.itemPressable,
                {
                    paddingLeft: INDENT + level * INDENT,
                    backgroundColor: hovered ? '#202425' : '#151718',
                },
                pressed && { backgroundColor: '#26292b' },
                style,
            ]}>
          <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {leftIcon}
            <react_native_1.Text style={styles.filename}>{filename}</react_native_1.Text>
          </react_native_1.View>

          <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!!info && <react_native_1.Text style={[styles.virtual, { marginRight: 8 }]}>{info}</react_native_1.Text>}
            {rightIcon}
          </react_native_1.View>
        </react_native_1.View>)}
    </Pressable_1.Pressable>);
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
function ArrowIcon({ rotation = 0 }) {
    return (<react_native_1.Image style={[
            styles.image,
            {
                transform: [{ rotate: `${rotation}deg` }],
            },
        ]} source={require('expo-router/assets/arrow_down.png')}/>);
}
function SystemInfo() {
    const getHermesVersion = () => {
        if (!global.HermesInternal) {
            return null;
        }
        const HERMES_RUNTIME = global.HermesInternal?.getRuntimeProperties?.() ?? {};
        const HERMES_VERSION = HERMES_RUNTIME['OSS Release Version'];
        const isStaticHermes = HERMES_RUNTIME['Static Hermes'];
        if (!HERMES_RUNTIME) {
            return null;
        }
        if (isStaticHermes) {
            return `${HERMES_VERSION} (shermes)`;
        }
        return HERMES_VERSION;
    };
    const locationOrigin = window.location.origin;
    const expoSdkVersion = expo_constants_1.default.expoConfig?.sdkVersion || 'Unknown';
    const hermesVersion = getHermesVersion();
    return (<react_native_1.View testID="sitemap-system-info" style={{
            gap: 8,
            marginTop: 16,
        }}>
      <react_native_1.Text style={styles.systemInfoTitle}>System Information</react_native_1.Text>
      <react_native_1.View style={styles.systemInfoContainer}>
        <FormText right={process.env.NODE_ENV}>Mode</FormText>
        <FormText right={expoSdkVersion}>Expo SDK</FormText>
        {hermesVersion && <FormText right={hermesVersion}>Hermes version</FormText>}
        {locationOrigin && <FormText right={locationOrigin}>Location origin</FormText>}
      </react_native_1.View>
    </react_native_1.View>);
}
function FormText({ children, right }) {
    return (<react_native_1.View style={styles.systemInfoItem}>
      <react_native_1.Text style={styles.systemInfoLabel} numberOfLines={1} ellipsizeMode="tail">
        {children}
      </react_native_1.Text>
      <react_native_1.View style={{ flex: 1 }}/>

      <react_native_1.Text selectable style={[styles.systemInfoValue, styles.code]} numberOfLines={1} ellipsizeMode="tail">
        {right}
      </react_native_1.Text>
    </react_native_1.View>);
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
        boxShadow: '0px 3px 3px rgba(0, 0, 0, 0.33)',
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
        gap: 12,
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
        borderCurve: 'continuous',
    },
    itemInnerContainer: {
        backgroundColor: '#151718',
        borderRadius: 12,
        borderCurve: 'continuous',
        gap: 12,
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
    systemInfoContainer: {
        borderWidth: 1,
        borderColor: '#313538',
        backgroundColor: '#151718',
        borderRadius: 12,
        gap: 8,
        borderCurve: 'continuous',
        padding: INDENT,
    },
    systemInfoTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: INDENT,
    },
    systemInfoItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    systemInfoLabel: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
    },
    systemInfoValue: {
        color: 'white',
        fontSize: 16,
        opacity: 0.7,
        flexShrink: 1,
        letterSpacing: 0.5,
    },
    code: {
        fontVariant: ['tabular-nums'],
        fontFamily: react_native_1.Platform.select({
            default: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
            ios: 'ui-monospace',
            android: 'monospace',
        }),
        fontWeight: '500',
    },
});
//# sourceMappingURL=Sitemap.js.map