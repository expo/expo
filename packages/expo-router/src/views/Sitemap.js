// Copyright © 2024 650 Industries.
'use client';
import Constants from 'expo-constants';
import React from 'react';
import { Image, StyleSheet, Text, View, ScrollView, Platform, StatusBar, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoSSR } from './NoSSR';
import { Pressable } from './Pressable';
import { useSitemap } from './useSitemap';
import { Link } from '../link/Link';
import { canOverrideStatusBarBehavior } from '../utils/statusbar';
const INDENT = 20;
export function getNavOptions() {
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
            const WrapperElement = Platform.OS === 'android' ? SafeAreaView : View;
            return (<WrapperElement style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <SitemapIcon />
            </View>
            <Text role="heading" aria-level={1} style={styles.title}>
              Sitemap
            </Text>
          </View>
        </WrapperElement>);
        },
    };
}
export function Sitemap() {
    // Following the https://github.com/expo/expo/blob/ubax/router/move-404-and-sitemap-to-root/packages/expo-router/src/getRoutesSSR.ts#L38
    // we need to ensure that the Sitemap component is not rendered on the server.
    return (<NoSSR>
      <SitemapInner />
    </NoSSR>);
}
function SitemapInner() {
    const sitemap = useSitemap();
    const children = React.useMemo(() => sitemap?.children.filter(({ isInternal }) => !isInternal) ?? [], [sitemap]);
    return (<View style={styles.container} testID="expo-router-sitemap">
      {canOverrideStatusBarBehavior && <StatusBar barStyle="light-content"/>}
      <ScrollView contentContainerStyle={styles.scroll} automaticallyAdjustContentInsets contentInsetAdjustmentBehavior="automatic">
        {children.map((child) => (<View testID="sitemap-item-container" key={child.contextKey} style={styles.itemContainer}>
            <SitemapItem node={child}/>
          </View>))}
        <SystemInfo />
      </ScrollView>
    </View>);
}
function SitemapItem({ node, level = 0 }) {
    const isLayout = React.useMemo(() => node.children.length > 0 || node.contextKey.match(/_layout\.[jt]sx?$/), [node]);
    const info = node.isInitial ? 'Initial' : node.isGenerated ? 'Generated' : '';
    if (isLayout) {
        return <LayoutSitemapItem node={node} level={level} info={info}/>;
    }
    return <StandardSitemapItem node={node} level={level} info={info}/>;
}
function LayoutSitemapItem({ node, level, info }) {
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    return (<View style={styles.itemInnerContainer}>
      <SitemapItemPressable style={{ opacity: 0.4 }} leftIcon={<PkgIcon />} rightIcon={<ArrowIcon rotation={isCollapsed ? 0 : 180}/>} filename={node.filename} level={level} info={info} onPress={() => setIsCollapsed((prev) => !prev)}/>
      {!isCollapsed &&
            node.children.map((child) => (<SitemapItem key={child.contextKey} node={child} level={level + (node.isGenerated ? 0 : 1)}/>))}
    </View>);
}
function StandardSitemapItem({ node, info, level }) {
    return (<Link accessibilityLabel={node.contextKey} href={node.href} asChild replace>
      <SitemapItemPressable leftIcon={<FileIcon />} rightIcon={<ForwardIcon />} filename={node.filename} level={level} info={info}/>
    </Link>);
}
function SitemapItemPressable({ style, leftIcon, rightIcon, filename, level, info, ...pressableProps }) {
    return (<Pressable {...pressableProps}>
      {({ pressed, hovered }) => (<View testID="sitemap-item" style={[
                styles.itemInnerContainer,
                styles.itemPressable,
                {
                    paddingLeft: INDENT + level * INDENT,
                    backgroundColor: hovered ? '#202425' : '#151718',
                },
                pressed && { backgroundColor: '#26292b' },
                style,
            ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {leftIcon}
            <Text style={styles.filename}>{filename}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!!info && <Text style={[styles.virtual, { marginRight: 8 }]}>{info}</Text>}
            {rightIcon}
          </View>
        </View>)}
    </Pressable>);
}
function FileIcon() {
    return <Image style={styles.image} source={require('expo-router/assets/file.png')}/>;
}
function PkgIcon() {
    return <Image style={styles.image} source={require('expo-router/assets/pkg.png')}/>;
}
function ForwardIcon() {
    return <Image style={styles.image} source={require('expo-router/assets/forward.png')}/>;
}
function SitemapIcon() {
    return <Image style={styles.image} source={require('expo-router/assets/sitemap.png')}/>;
}
function ArrowIcon({ rotation = 0 }) {
    return (<Image style={[
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
    const expoSdkVersion = Constants.expoConfig?.sdkVersion || 'Unknown';
    const hermesVersion = getHermesVersion();
    return (<View testID="sitemap-system-info" style={{
            gap: 8,
            marginTop: 16,
        }}>
      <Text style={styles.systemInfoTitle}>System Information</Text>
      <View style={styles.systemInfoContainer}>
        <FormText right={process.env.NODE_ENV}>Mode</FormText>
        <FormText right={expoSdkVersion}>Expo SDK</FormText>
        {hermesVersion && <FormText right={hermesVersion}>Hermes version</FormText>}
        {locationOrigin && <FormText right={locationOrigin}>Location origin</FormText>}
      </View>
    </View>);
}
function FormText({ children, right }) {
    return (<View style={styles.systemInfoItem}>
      <Text style={styles.systemInfoLabel} numberOfLines={1} ellipsizeMode="tail">
        {children}
      </Text>
      <View style={{ flex: 1 }}/>

      <Text selectable style={[styles.systemInfoValue, styles.code]} numberOfLines={1} ellipsizeMode="tail">
        {right}
      </Text>
    </View>);
}
const styles = StyleSheet.create({
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
        ...Platform.select({
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
        ...Platform.select({
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
        ...Platform.select({
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
        fontFamily: Platform.select({
            default: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
            ios: 'ui-monospace',
            android: 'monospace',
        }),
        fontWeight: '500',
    },
});
//# sourceMappingURL=Sitemap.js.map