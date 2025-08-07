"use strict";
// Copyright © 2024 650 Industries.
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unmatched = Unmatched;
const native_1 = require("@react-navigation/native");
const expo_linking_1 = require("expo-linking");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const hooks_1 = require("../hooks");
const NoSSR_1 = require("./NoSSR");
const Link_1 = require("../link/Link");
const useNavigation_1 = require("../useNavigation");
const useSafeLayoutEffect_1 = require("./useSafeLayoutEffect");
const stack_1 = require("../utils/stack");
const Pressable_1 = require("../views/Pressable");
/**
 * Default screen for unmatched routes.
 *
 * @hidden
 */
function Unmatched() {
    // Following the https://github.com/expo/expo/blob/ubax/router/move-404-and-sitemap-to-root/packages/expo-router/src/getRoutesSSR.ts#L51
    // we need to ensure that the Unmatched component is not rendered on the server.
    return (<NoSSR_1.NoSSR>
      <UnmatchedInner />
    </NoSSR_1.NoSSR>);
}
function UnmatchedInner() {
    const [render, setRender] = react_1.default.useState(false);
    const router = (0, hooks_1.useRouter)();
    const route = (0, native_1.useRoute)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const pathname = (0, hooks_1.usePathname)();
    const url = (0, expo_linking_1.createURL)(pathname);
    react_1.default.useEffect(() => {
        setRender(true);
    }, []);
    const isFocused = navigation.isFocused();
    const isPreloaded = (0, stack_1.isRoutePreloadedInStack)(navigation.getState(), route);
    /** This route may be prefetched if a <Link prefetch href="/<unmatched>" /> is used */
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (!isPreloaded || (isPreloaded && isFocused)) {
            navigation.setOptions({
                title: 'Not Found',
            });
        }
    }, [isFocused, isPreloaded, navigation]);
    return (<react_native_1.View testID="expo-router-unmatched" style={styles.container}>
      <NotFoundAsset />
      <react_native_1.Text role="heading" aria-level={1} style={styles.title}>
        Unmatched Route
      </react_native_1.Text>
      <react_native_1.Text role="heading" aria-level={2} style={[styles.subtitle, styles.secondaryText]}>
        Page could not be found.
      </react_native_1.Text>
      {render ? (<Link_1.Link href={pathname} replace {...react_native_1.Platform.select({ native: { asChild: true } })}>
          <Pressable_1.Pressable>
            {({ hovered, pressed }) => (<react_native_1.Text style={[
                    styles.pageLink,
                    styles.secondaryText,
                    react_native_1.Platform.select({
                        web: {
                            transitionDuration: '200ms',
                            opacity: 1,
                        },
                    }),
                    hovered && {
                        opacity: 0.8,
                        textDecorationLine: 'underline',
                    },
                    pressed && {
                        opacity: 0.8,
                    },
                ]}>
                {url}
              </react_native_1.Text>)}
          </Pressable_1.Pressable>
        </Link_1.Link>) : (<react_native_1.View style={[styles.pageLink, styles.placeholder]}/>)}
      <react_native_1.View style={styles.linkContainer}>
        <Pressable_1.Pressable>
          {({ hovered, pressed }) => (<react_native_1.Text onPress={() => {
                if (router.canGoBack()) {
                    router.back();
                }
                else {
                    router.replace('/');
                }
            }} style={[
                styles.link,
                react_native_1.Platform.select({
                    web: {
                        transitionDuration: '200ms',
                        opacity: 1,
                    },
                }),
                hovered && {
                    opacity: 0.8,
                    textDecorationLine: 'underline',
                },
                pressed && {
                    opacity: 0.8,
                },
            ]}>
              Go back
            </react_native_1.Text>)}
        </Pressable_1.Pressable>
        <react_native_1.Text style={[styles.linkSeparator, styles.secondaryText]}>•</react_native_1.Text>
        <Link_1.Link href="/_sitemap" replace {...react_native_1.Platform.select({ native: { asChild: true } })}>
          <Pressable_1.Pressable>
            {({ hovered, pressed }) => (<react_native_1.Text style={[
                styles.link,
                react_native_1.Platform.select({
                    web: {
                        transitionDuration: '200ms',
                        opacity: 1,
                    },
                }),
                hovered && {
                    opacity: 0.8,
                    textDecorationLine: 'underline',
                },
                pressed && {
                    opacity: 0.8,
                },
            ]}>
                Sitemap
              </react_native_1.Text>)}
          </Pressable_1.Pressable>
        </Link_1.Link>
      </react_native_1.View>
    </react_native_1.View>);
}
function NotFoundAsset() {
    return <react_native_1.Image source={require('expo-router/assets/unmatched.png')} style={styles.image}/>;
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 24,
        paddingBottom: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 270,
        height: 168,
        resizeMode: 'contain',
        marginBottom: 28,
    },
    title: {
        ...react_native_1.Platform.select({
            web: {
                fontSize: 64,
                lineHeight: 64,
            },
            default: {
                fontSize: 56,
                lineHeight: 56,
            },
        }),
        color: '#fff',
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 34,
        marginTop: 4,
        marginBottom: 12,
        fontWeight: '200',
        textAlign: 'center',
    },
    pageLink: {
        minHeight: 20,
    },
    secondaryText: {
        color: '#9ba1a6',
    },
    placeholder: {
        backgroundColor: '#9ba1a644',
        minWidth: 180,
        borderRadius: 5,
    },
    linkContainer: {
        marginTop: 28,
        flexDirection: 'row',
        gap: 12,
    },
    link: {
        fontSize: 20,
        textAlign: 'center',
        color: '#52a9ff',
    },
    linkSeparator: {
        fontSize: 20,
    },
});
//# sourceMappingURL=Unmatched.js.map