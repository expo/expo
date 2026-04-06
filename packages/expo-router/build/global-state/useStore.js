"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = useStore;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const getRouteInfoFromState_1 = require("./getRouteInfoFromState");
const routeInfoCache_1 = require("./routeInfoCache");
const store_1 = require("./store");
const extractPathFromURL_1 = require("../fork/extractPathFromURL");
const getStateFromPath_forks_1 = require("../fork/getStateFromPath-forks");
const getLinkingConfig_1 = require("../getLinkingConfig");
const getReactNavigationConfig_1 = require("../getReactNavigationConfig");
const getRoutes_1 = require("../getRoutes");
const native_1 = require("../react-navigation/native");
const useScreens_1 = require("../useScreens");
const url_1 = require("../utils/url");
function useStore(context, linkingConfigOptions, serverUrl) {
    const navigationRef = (0, native_1.useNavigationContainerRef)();
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    let linking;
    let rootComponent = react_1.Fragment;
    let initialState;
    const routeNode = (0, getRoutes_1.getRoutes)(context, {
        ...config,
        skipGenerated: true,
        ignoreEntryPoints: true,
        platform: react_native_1.Platform.OS,
        preserveRedirectAndRewrites: true,
    });
    const redirects = [config?.redirects, config?.rewrites]
        .filter(Boolean)
        .flat()
        .map((route) => {
        return [
            (0, getStateFromPath_forks_1.routePatternToRegex)((0, getReactNavigationConfig_1.parseRouteSegments)(route.source)),
            route,
            (0, url_1.shouldLinkExternally)(route.destination),
        ];
    });
    if (routeNode) {
        // We have routes, so get the linking config and the root component
        linking = (0, getLinkingConfig_1.getLinkingConfig)(routeNode, context, () => store_1.store.getRouteInfo(), {
            metaOnly: linkingConfigOptions.metaOnly,
            serverUrl,
            redirects,
            skipGenerated: config?.skipGenerated ?? false,
            sitemap: config?.sitemap ?? true,
            notFound: config?.notFound ?? true,
        });
        rootComponent = (0, useScreens_1.getQualifiedRouteComponent)(routeNode);
        // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
        // This will cause static rendering to fail, which once performs a single pass.
        // If the initialURL is a string, we can prefetch the state and routeInfo, skipping React Navigation's async behavior.
        const initialURL = linking?.getInitialURL?.();
        if (typeof initialURL === 'string') {
            let initialPath = (0, extractPathFromURL_1.extractExpoPathFromURL)(linking.prefixes, initialURL);
            // It does not matter if the path starts with a `/` or not, but this keeps the behavior consistent
            if (!initialPath.startsWith('/'))
                initialPath = '/' + initialPath;
            initialState = linking.getStateFromPath(initialPath, linking.config);
            const initialRouteInfo = (0, getRouteInfoFromState_1.getRouteInfoFromState)(initialState);
            (0, routeInfoCache_1.setCachedRouteInfo)(initialState, initialRouteInfo);
        }
    }
    else {
        // Only error in production, in development we will show the onboarding screen
        if (process.env.NODE_ENV === 'production') {
            throw new Error('No routes found');
        }
        // In development, we will show the onboarding screen
        rootComponent = react_1.Fragment;
    }
    if (react_native_1.Platform.OS === 'android' && store_1.storeRef.current.state && store_1.storeRef.current.context === context) {
        initialState = store_1.storeRef.current.state;
    }
    store_1.storeRef.current = {
        navigationRef,
        routeNode,
        config,
        rootComponent,
        linking,
        redirects,
        state: initialState,
        context,
    };
    if (initialState) {
        store_1.storeRef.current.routeInfo = (0, routeInfoCache_1.getCachedRouteInfo)(initialState);
    }
    (0, react_1.useEffect)(() => {
        return () => {
            // listener();
            const animationFrame = (0, store_1.getSplashScreenAnimationFrame)();
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                (0, store_1.setSplashScreenAnimationFrame)(undefined);
            }
        };
    });
    return store_1.store;
}
//# sourceMappingURL=useStore.js.map